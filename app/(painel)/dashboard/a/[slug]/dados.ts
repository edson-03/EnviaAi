import { cache } from "react";
import { ObjectId } from "mongodb";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { albums } from "@/lib/mongodb";
import { situacaoDoAlbum } from "@/lib/planos";

// Sessão + álbum do dono, buscados uma vez por requisição (layout e página usam os dois).
export const albumDoDono = cache(async (slug: string) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/entrar");
  const album = await albums.findOne({ slug, ownerId: new ObjectId(session.user.id) });
  if (!album) notFound();
  // Plano valendo agora: cortesia do dono, plano comprado e vigente, ou grátis.
  const situacao = await situacaoDoAlbum(album, (session.user as { plano?: string }).plano ?? null);
  return { session, album, situacao };
});

export function linkDoAlbum(slug: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL}/a/${slug}`;
}
