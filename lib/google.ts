// Acesso ao Google Drive do organizador. Somente servidor.
import { ObjectId } from "mongodb";
import { auth } from "./auth";
import { db } from "./mongodb";

export const DRIVE_API = "https://www.googleapis.com/drive/v3";

// Sem conta Google, refresh token revogado/expirado ou sem permissão do Drive.
export class DriveDesconectado extends Error {
  constructor() {
    super("Drive desconectado");
  }
}

// Devolve um access token válido; o Better Auth renova pelo refresh token se expirou.
export async function obterAccessToken(userId: string) {
  const conta = await db
    .collection("account")
    .findOne({ userId: new ObjectId(userId), providerId: "google" }, { projection: { _id: 1 } });
  if (!conta) throw new DriveDesconectado();

  try {
    const { accessToken } = await auth.api.getAccessToken({
      body: { accountId: conta._id.toString(), userId },
    });
    return accessToken;
  } catch {
    throw new DriveDesconectado();
  }
}

// 401 = token inválido; 403 por escopo insuficiente = caixa do Drive desmarcada.
async function acessoNegado(res: Response) {
  if (res.status === 401) return true;
  if (res.status !== 403) return false;
  return /insufficient/i.test(await res.clone().text());
}

// Cria uma pasta na raiz do Drive do usuário e devolve o id.
export async function criarPasta(userId: string, nome: string) {
  const token = await obterAccessToken(userId);
  const res = await fetch(`${DRIVE_API}/files?fields=id`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: nome, mimeType: "application/vnd.google-apps.folder" }),
  });
  if (await acessoNegado(res)) throw new DriveDesconectado();
  if (!res.ok) throw new Error(`Drive files.create falhou: ${res.status}`);
  const { id } = await res.json();
  return id as string;
}

export async function renomearPasta(userId: string, folderId: string, nome: string) {
  const token = await obterAccessToken(userId);
  const res = await fetch(`${DRIVE_API}/files/${folderId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: nome }),
  });
  if (await acessoNegado(res)) throw new DriveDesconectado();
  if (!res.ok) throw new Error(`Drive files.update falhou: ${res.status}`);
}

// Envio pequeno (ex.: capa) em uma requisição multipart. Arquivos de convidados NÃO usam isto.
export async function enviarArquivoPequeno(userId: string, folderId: string, nome: string, arquivo: Blob) {
  const token = await obterAccessToken(userId);
  const limite = `enviai${Date.now()}`;
  const corpo = new Blob([
    `--${limite}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
    JSON.stringify({ name: nome, parents: [folderId] }),
    `\r\n--${limite}\r\nContent-Type: ${arquivo.type}\r\n\r\n`,
    arquivo,
    `\r\n--${limite}--`,
  ]);
  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": `multipart/related; boundary=${limite}` },
    body: corpo,
  });
  if (await acessoNegado(res)) throw new DriveDesconectado();
  if (!res.ok) throw new Error(`Drive upload multipart falhou: ${res.status}`);
  return ((await res.json()) as { id: string }).id;
}

export async function apagarArquivo(userId: string, fileId: string) {
  const token = await obterAccessToken(userId);
  await fetch(`${DRIVE_API}/files/${fileId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
}

export async function baixarArquivo(userId: string, fileId: string) {
  const token = await obterAccessToken(userId);
  return fetch(`${DRIVE_API}/files/${fileId}?alt=media`, { headers: { Authorization: `Bearer ${token}` } });
}

export type StatusDrive = { conectado: true; livreBytes: number | null } | { conectado: false };

export async function statusDrive(userId: string): Promise<StatusDrive> {
  let token: string;
  try {
    token = await obterAccessToken(userId);
  } catch (e) {
    if (e instanceof DriveDesconectado) return { conectado: false };
    throw e;
  }

  const res = await fetch(`${DRIVE_API}/about?fields=storageQuota`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (await acessoNegado(res)) return { conectado: false };
  if (!res.ok) throw new Error(`Drive about.get falhou: ${res.status}`);

  const { storageQuota } = await res.json();
  // Sem "limit" = armazenamento ilimitado (algumas contas Workspace).
  const livreBytes = storageQuota.limit ? Number(storageQuota.limit) - Number(storageQuota.usage) : null;
  return { conectado: true, livreBytes };
}
