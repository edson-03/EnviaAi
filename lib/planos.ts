// Regras do plano grátis x premium (premium é por álbum/evento). Somente servidor.
import type { ObjectId } from "mongodb";
import { albums, db, type Album } from "./mongodb";
import { MAX_ARQUIVOS_POR_ALBUM } from "./upload-limits";

export const PRECO_PREMIUM_CENTAVOS = 2990; // R$ 29,90 por evento
export const LIMITE_ARQUIVOS_GRATIS = 200;
export const ALBUNS_ATIVOS_GRATIS = 1;

export const precoFormatado = () =>
  (PRECO_PREMIUM_CENTAVOS / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Premium = pago para este álbum, ou dono com plano "premium" (cortesia dada pelo /admin).
export async function albumEhPremium(album: Pick<Album, "premium" | "ownerId">) {
  if (album.premium) return true;
  const dono = await db.collection("user").findOne({ _id: album.ownerId }, { projection: { plano: 1 } });
  return dono?.plano === "premium";
}

export function limiteDeArquivos(premium: boolean) {
  return premium ? MAX_ARQUIVOS_POR_ALBUM : LIMITE_ARQUIVOS_GRATIS;
}

// Plano grátis: no máximo 1 álbum não-premium recebendo arquivos ao mesmo tempo.
export async function podeTerMaisUmAlbumAtivo(ownerId: ObjectId, exceto?: ObjectId) {
  const dono = await db.collection("user").findOne({ _id: ownerId }, { projection: { plano: 1 } });
  if (dono?.plano === "premium") return true;
  const ativos = await albums.countDocuments({
    ownerId,
    ativo: true,
    premium: { $ne: true },
    suspenso: { $ne: true },
    ...(exceto && { _id: { $ne: exceto } }),
  });
  return ativos < ALBUNS_ATIVOS_GRATIS;
}

export const MENSAGEM_LIMITE_ATIVOS =
  "No plano grátis você pode ter 1 álbum recebendo arquivos por vez. Pause o outro álbum ou libere o premium dele.";
