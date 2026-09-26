import { cache } from "react";
import { ObjectId } from "mongodb";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { albums } from "@/lib/mongodb";

// Sessão + álbum do dono, buscados uma vez por requisição (layout e página usam os dois).
export const albumDoDono = cache(async (slug: string) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/entrar");
  const album = await albums.findOne({ slug, ownerId: new ObjectId(session.user.id) });
  if (!album) notFound();
  // Premium: pago para o álbum, ou cortesia no usuário (plano "premium", dado pelo /admin).
  const premium = Boolean(album.premium) || (session.user as { plano?: string }).plano === "premium";
  return { session, album, premium };
});

export function linkDoAlbum(slug: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL}/a/${slug}`;
}
