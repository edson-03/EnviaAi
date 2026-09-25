// Miniatura de um envio para o painel. Só o dono do álbum (logado) acessa; cache só no navegador dele.
import { ObjectId } from "mongodb";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { baixarMiniatura } from "@/lib/google";
import { albums, uploads } from "@/lib/mongodb";

const LADO = 480; // px, suficiente para a grade do painel

export async function GET(_: Request, { params }: { params: Promise<{ slug: string; fileId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response(null, { status: 401 });

  const { slug, fileId } = await params;
  const album = await albums.findOne({ slug, ownerId: new ObjectId(session.user.id) }, { projection: { _id: 1 } });
  if (!album) return new Response(null, { status: 404 });
  if (!(await uploads.countDocuments({ albumId: album._id, driveFileId: fileId }, { limit: 1 }))) {
    return new Response(null, { status: 404 });
  }

  try {
    const res = await baixarMiniatura(session.user.id, fileId, LADO);
    if (!res) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
    return new Response(res.body, {
      headers: { "Content-Type": res.headers.get("content-type") ?? "image/jpeg", "Cache-Control": "private, max-age=86400" },
    });
  } catch {
    return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
}
