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

export const albums: Collection<Album> = db.collection<Album>("albums");
export const uploads: Collection<Upload> = db.collection<Upload>("uploads");
export const rateLimits: Collection<RateLimit> = db.collection<RateLimit>("rateLimits");
