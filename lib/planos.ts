// Planos (grátis e pagos por evento), configuráveis no /admin/planos. Somente servidor.
// Na compra, o álbum guarda uma cópia do plano ("planoContratado"): mudanças posteriores no plano
// valem só para novas compras. O plano grátis vale sempre pela configuração atual.
import { cache } from "react";
import type { ObjectId } from "mongodb";
import { albums, db, planos, type Album, type Plano, type PlanoContratado } from "./mongodb";

export const PLANO_GRATIS_ID = "gratis";
export const PLANO_CORTESIA_ID = "premium"; // usuário com plano "premium" (dado no /admin) usa este plano em todos os álbuns
const GB = 1024 ** 3;

// Usados só se o plano ainda não existir no banco (o db:setup cria os dois).
const PADRAO: Record<string, Omit<Plano, "createdAt" | "atualizadoEm">> = {
  [PLANO_GRATIS_ID]: {
    _id: PLANO_GRATIS_ID, nome: "Grátis", tipo: "gratis", precoCentavos: 0, limiteArquivos: 200, maxBytesArquivo: 4 * GB,
    telao: false, personalizacao: false, validadeDias: null, albunsAtivos: 1, ativo: true, ordem: 0,
  },
  [PLANO_CORTESIA_ID]: {
    _id: PLANO_CORTESIA_ID, nome: "Premium", tipo: "pago", precoCentavos: 2990, limiteArquivos: 5000, maxBytesArquivo: 4 * GB,
    telao: true, personalizacao: true, validadeDias: null, ativo: true, ordem: 1,
  },
};

export const listarPlanos = cache(async () => planos.find().sort({ ordem: 1, precoCentavos: 1 }).toArray());

async function planoPorId(id: string) {
  return (await listarPlanos()).find((p) => p._id === id) ?? PADRAO[id] ?? null;
}

export async function planoGratis() {
  return (await planoPorId(PLANO_GRATIS_ID))!;
}

export async function planosAVenda() {
  return (await listarPlanos()).filter((p) => p.tipo === "pago" && p.ativo);
}

// Para páginas públicas (landing): se o banco falhar, mostra o grátis padrão e nenhum plano pago,
// em vez de derrubar a página (ela é refeita em 5 minutos).
export async function planosParaVitrine() {
  try {
    return { gratis: await planoGratis(), aVenda: await planosAVenda() };
  } catch (e) {
    console.error("Não foi possível ler os planos; usando o padrão", e);
    return { gratis: PADRAO[PLANO_GRATIS_ID] as Plano, aVenda: [] as Plano[] };
  }
}

export function copiaDoPlano(p: Pick<Plano, keyof PlanoContratado>, precoPagoCentavos: number): PlanoContratado {
  return {
    _id: p._id, nome: p.nome, precoCentavos: precoPagoCentavos, limiteArquivos: p.limiteArquivos,
    maxBytesArquivo: p.maxBytesArquivo, telao: p.telao, personalizacao: p.personalizacao, validadeDias: p.validadeDias,
  };
}

export type SituacaoAlbum = {
  plano: PlanoContratado; // regras valendo agora
  pago: boolean; // plano pago vigente (comprado ou cortesia)
  cortesia: boolean;
  prazoFinal?: Date; // até quando recebe arquivos
  prazoEncerrado: boolean;
  planoVencido?: string; // nome do plano pago que venceu (o álbum voltou ao grátis)
};

type AlbumParaSituacao = Pick<Album, "ownerId" | "createdAt" | "planoContratado" | "planoExpiraEm">;

// Plano que vale para o álbum agora: cortesia do dono > plano comprado e vigente > grátis.
export async function situacaoDoAlbum(album: AlbumParaSituacao, planoDoDono?: string | null): Promise<SituacaoAlbum> {
  const agora = new Date();
  if (planoDoDono === undefined) {
    const dono = await db.collection("user").findOne({ _id: album.ownerId }, { projection: { plano: 1 } });
    planoDoDono = (dono?.plano as string | undefined) ?? null;
  }
  if (planoDoDono === PLANO_CORTESIA_ID) {
    const p = (await planoPorId(PLANO_CORTESIA_ID))!;
    return { plano: copiaDoPlano(p, 0), pago: true, cortesia: true, prazoEncerrado: false };
  }

  const vigente = album.planoContratado && (!album.planoExpiraEm || album.planoExpiraEm > agora);
  if (vigente) {
    return { plano: album.planoContratado!, pago: true, cortesia: false, prazoFinal: album.planoExpiraEm, prazoEncerrado: false };
  }

  const gratis = await planoGratis();
  const prazoFinal = gratis.validadeDias ? new Date(album.createdAt.getTime() + gratis.validadeDias * 86400000) : undefined;
  return {
    plano: copiaDoPlano(gratis, 0),
    pago: false,
    cortesia: false,
    prazoFinal,
    prazoEncerrado: Boolean(prazoFinal && prazoFinal <= agora),
    planoVencido: album.planoContratado?.nome,
  };
}

// Plano grátis: limite de álbuns sem plano pago vigente recebendo arquivos ao mesmo tempo.
export async function podeTerMaisUmAlbumAtivo(ownerId: ObjectId, exceto?: ObjectId) {
  const dono = await db.collection("user").findOne({ _id: ownerId }, { projection: { plano: 1 } });
  if (dono?.plano === PLANO_CORTESIA_ID) return true;
  const limite = (await planoGratis()).albunsAtivos ?? 1;
  const ativosGratis = await albums.countDocuments({
    ownerId,
    ativo: true,
    suspenso: { $ne: true },
    $or: [{ planoContratado: { $exists: false } }, { planoExpiraEm: { $lte: new Date() } }],
    ...(exceto && { _id: { $ne: exceto } }),
  });
  return ativosGratis < limite;
}

export const mensagemLimiteAtivos = async () => {
  const n = (await planoGratis()).albunsAtivos ?? 1;
  return `No plano grátis você pode ter ${n} ${n === 1 ? "álbum recebendo" : "álbuns recebendo"} arquivos por vez. Pause outro álbum ou contrate um plano para este.`;
};

export function formatarPreco(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatarTamanho(bytes: number) {
  return bytes >= GB
    ? `${(bytes / GB).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} GB`
    : `${Math.round(bytes / 1024 ** 2)} MB`;
}
