// Telão: acesso pelo link secreto /telao/<token>. Somente servidor.
import { albums, db } from "./mongodb";

export const LADO_MINIATURA_TELAO = 1600; // px

// Álbum do telão, ou null se o token não existe ou o álbum/dono está suspenso.
export async function albumDoTelao(token: string) {
  if (!/^[\w-]{20,64}$/.test(token)) return null;
  const album = await albums.findOne(
    { telaoToken: token, suspenso: { $ne: true } },
    { projection: { slug: 1, titulo: 1, corTema: 1, ownerId: 1 } },
  );
  if (!album) return null;
  const donoSuspenso = await db.collection("user").countDocuments({ _id: album.ownerId, suspenso: true }, { limit: 1 });
  return donoSuspenso ? null : album;
}
