"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/admin";
import { testarConexao } from "@/lib/mercadopago";
import { albums, db, planos } from "@/lib/mongodb";

const PLANOS = ["free", "premium"]; // plano do USUÁRIO: "premium" = cortesia (todos os álbuns no plano Premium)

export type EstadoPlano = { erro?: string; ok?: boolean };

const GB = 1024 ** 3;

// Aceita "29,90", "1.000,50" e também "0.5" (ponto decimal, sem vírgula).
function numero(form: FormData, campo: string) {
  let bruto = String(form.get(campo) ?? "").trim();
  if (bruto.includes(",")) bruto = bruto.replace(/\./g, "").replace(",", ".");
  return bruto === "" ? null : Number(bruto);
}

// Cria ou edita um plano (o grátis também). _id só é escolhido na criação.
export async function salvarPlano(idExistente: string | null, _: EstadoPlano, form: FormData): Promise<EstadoPlano> {
  await exigirAdmin();
  const existente = idExistente ? await planos.findOne({ _id: idExistente }) : null;
  if (idExistente && !existente) return { erro: "Plano não encontrado." };

  const id = existente?._id ?? String(form.get("id") ?? "").trim().toLowerCase();
  const tipo = existente?.tipo ?? "pago"; // o grátis já existe; novos planos são sempre pagos
  const nome = String(form.get("nome") ?? "").trim();
  const preco = numero(form, "preco");
  const limiteArquivos = numero(form, "limiteArquivos");
  const maxGb = numero(form, "maxGb");
  const validadeDias = numero(form, "validadeDias");
  const albunsAtivos = numero(form, "albunsAtivos");
  const ordem = numero(form, "ordem") ?? 0;

  if (!/^[a-z0-9-]{2,40}$/.test(id)) return { erro: "Código do plano: 2 a 40 letras minúsculas, números ou hífen (ex.: basico)." };
  if (!existente && (await planos.countDocuments({ _id: id }))) return { erro: "Já existe um plano com esse código." };
  if (!nome || nome.length > 60) return { erro: "Informe um nome de até 60 caracteres." };
  if (tipo === "pago" && (preco === null || !(preco >= 1) || preco > 100000)) return { erro: "Preço entre R$ 1,00 e R$ 100.000,00." };
  if (limiteArquivos === null || !Number.isInteger(limiteArquivos) || limiteArquivos < 1 || limiteArquivos > 100000) {
    return { erro: "Limite de arquivos entre 1 e 100.000." };
  }
  if (maxGb === null || !(maxGb >= 0.01) || maxGb > 20) return { erro: "Tamanho máximo por arquivo entre 0,01 e 20 GB." };
  if (validadeDias !== null && (!Number.isInteger(validadeDias) || validadeDias < 1 || validadeDias > 3650)) {
    return { erro: "Validade entre 1 e 3.650 dias, ou vazio para sem prazo." };
  }
  if (tipo === "gratis" && (albunsAtivos === null || !Number.isInteger(albunsAtivos) || albunsAtivos < 1 || albunsAtivos > 50)) {
    return { erro: "Álbuns recebendo ao mesmo tempo: entre 1 e 50." };
  }

  const agora = new Date();
  const dados = {
    nome,
    tipo,
    precoCentavos: tipo === "pago" ? Math.round(preco! * 100) : 0,
    limiteArquivos,
    maxBytesArquivo: Math.round(maxGb * GB),
    telao: form.get("telao") === "on",
    personalizacao: form.get("personalizacao") === "on",
    validadeDias,
    ...(tipo === "gratis" && { albunsAtivos: albunsAtivos! }),
    ativo: tipo === "gratis" ? true : form.get("ativo") === "on",
    ordem,
    atualizadoEm: agora,
  };
  await planos.updateOne({ _id: id }, { $set: dados, $setOnInsert: { createdAt: agora } }, { upsert: true });
  revalidatePath("/admin/planos");
  return { ok: true };
}

export async function testarMercadoPago() {
  await exigirAdmin();
  try {
    return await testarConexao();
  } catch (e) {
    return { ok: false as const, erro: (e as Error).message };
  }
}

export async function definirPlano(userId: string, plano: string) {
  await exigirAdmin();
  if (!PLANOS.includes(plano)) return;
  await db.collection("user").updateOne({ _id: new ObjectId(userId) }, { $set: { plano } });
  revalidatePath("/admin", "layout");
}

// Suspender: bloqueia login (ver lib/auth.ts), encerra as sessões e para os envios dos álbuns dele.
export async function definirSuspensaoUsuario(userId: string, suspenso: boolean) {
  const admin = await exigirAdmin();
  if (userId === admin.user.id) return; // não suspender a si mesmo
  const _id = new ObjectId(userId);
  await db.collection("user").updateOne({ _id }, { $set: { suspenso } });
  if (suspenso) await db.collection("session").deleteMany({ userId: _id });
  revalidatePath("/admin", "layout");
}

export async function definirSuspensaoAlbum(albumId: string, suspenso: boolean) {
  await exigirAdmin();
  await albums.updateOne({ _id: new ObjectId(albumId) }, suspenso ? { $set: { suspenso: true } } : { $unset: { suspenso: 1 } });
  revalidatePath("/admin", "layout");
}
