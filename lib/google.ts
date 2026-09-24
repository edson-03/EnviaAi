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
