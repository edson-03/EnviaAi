// Conexão única com o MongoDB (reutilizada entre hot reloads e invocações). Somente servidor.
import { MongoClient, type Collection, type ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI não definida");

const g = globalThis as { _mongoClient?: MongoClient };
export const client = g._mongoClient ?? new MongoClient(uri);
if (process.env.NODE_ENV !== "production") g._mongoClient = client;

export const db = client.db(process.env.MONGODB_DB ?? "enviai");

// Coleções do app. As do Better Auth (user, session, account, verification)
// são gerenciadas por ele.
export type Album = {
  _id: ObjectId;
  ownerId: ObjectId; // user._id do Better Auth
  slug: string;
  titulo: string;
  tipoEvento?: string;
  dataEvento?: Date;
  driveFolderId: string;
  capaUrl?: string;
  capaDriveFileId?: string; // imagem de capa na pasta do álbum; servida por /api/capa/[slug]
  corTema: string;
  mensagemBoasVindas?: string;
  galeriaPublica: boolean;
  ativo: boolean;
  suspenso?: boolean; // pelo /admin; o dono não consegue reverter
  telaoToken?: string; // link secreto /telao/<token>; trocar = invalidar o anterior
  ultimoResumoEm?: Date; // último e-mail de resumo enviado ao dono (máx. 1 por hora)
  // Plano pago comprado para este álbum (cópia do plano na hora da compra). Ver lib/planos.ts.
  planoContratado?: PlanoContratado;
  planoDesde?: Date;
  planoExpiraEm?: Date; // fim do período em que recebe arquivos; ausente = sem prazo
  planoPagamentoId?: string; // mpPaymentId que liberou o plano (para estorno)
  createdAt: Date;
};

export type Upload = {
  _id: ObjectId;
  albumId: ObjectId;
  driveFileId: string;
  nomeArquivo: string;
  mimeType: string;
  tamanhoBytes: number;
  nomeConvidado?: string;
  legenda?: string;
  aprovado: boolean;
  createdAt: Date;
};

// Contador de requisições por chave (ex.: "upload-session:<ip>:<janela>"). Apagado pelo índice TTL.
export type RateLimit = {
  _id: string;
  count: number;
  expiresAt: Date;
};

// Plano configurável no /admin/planos. _id legível ("gratis", "premium", "basico"...).
export type Plano = {
  _id: string;
  nome: string;
  tipo: "gratis" | "pago"; // só existe um "gratis"
  precoCentavos: number;
  limiteArquivos: number;
  maxBytesArquivo: number;
  telao: boolean;
  personalizacao: boolean; // cor e capa
  validadeDias: number | null; // dias recebendo arquivos (pago: desde a compra; grátis: desde a criação); null = sem prazo
  albunsAtivos?: number; // só no grátis: álbuns recebendo ao mesmo tempo
  ativo: boolean; // à venda
  ordem: number;
  createdAt: Date;
  atualizadoEm: Date;
};

export type PlanoContratado = Pick<
  Plano,
  "_id" | "nome" | "precoCentavos" | "limiteArquivos" | "maxBytesArquivo" | "telao" | "personalizacao" | "validadeDias"
>;

// Pagamento de um plano de um álbum (Mercado Pago). Status copiado da API do Mercado Pago.
export type Pagamento = {
  _id: ObjectId;
  albumId: ObjectId;
  ownerId: ObjectId;
  planoId?: string;
  mpPaymentId: string;
  status: string; // approved, pending, rejected, refunded...
  valorCentavos: number;
  metodo?: string; // pix, credit_card...
  createdAt: Date;
  atualizadoEm: Date;
};

export const albums: Collection<Album> = db.collection<Album>("albums");
export const uploads: Collection<Upload> = db.collection<Upload>("uploads");
export const rateLimits: Collection<RateLimit> = db.collection<RateLimit>("rateLimits");
export const pagamentos: Collection<Pagamento> = db.collection<Pagamento>("pagamentos");
export const planos: Collection<Plano> = db.collection<Plano>("planos");
