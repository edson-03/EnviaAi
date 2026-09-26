// Telão: acesso pelo link secreto /telao/<token>. Recurso premium. Somente servidor.
import { albums, db } from "./mongodb";

export const LADO_MINIATURA_TELAO = 1600; // px

// Álbum do telão, ou null se o token não existe, o álbum/dono está suspenso ou o álbum não é premium.
export async function albumDoTelao(token: string) {
  if (!/^[\w-]{20,64}$/.test(token)) return null;
  const album = await albums.findOne(
    { telaoToken: token, suspenso: { $ne: true } },
    { projection: { slug: 1, titulo: 1, corTema: 1, ownerId: 1, premium: 1 } },
  );
  if (!album) return null;
  const dono = await db.collection("user").findOne({ _id: album.ownerId }, { projection: { suspenso: 1, plano: 1 } });
  if (dono?.suspenso) return null;
  return album.premium || dono?.plano === "premium" ? album : null;
}
