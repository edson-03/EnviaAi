// Áudio do livro de visitas para o player do painel. Só o dono logado; repassa "Range" ao Drive
// (o Safari exige respostas parciais para tocar áudio).
import { ObjectId } from "mongodb";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { DRIVE_API, obterAccessToken } from "@/lib/google";
import { albums, mensagens } from "@/lib/mongodb";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string; fileId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response(null, { status: 401 });

  const { slug, fileId } = await params;
  const album = await albums.findOne({ slug, ownerId: new ObjectId(session.user.id) }, { projection: { _id: 1 } });
  if (!album || !(await mensagens.countDocuments({ albumId: album._id, audioDriveFileId: fileId }, { limit: 1 }))) {
    return new Response(null, { status: 404 });
  }

  const token = await obterAccessToken(session.user.id);
  const intervalo = req.headers.get("range");
  const res = await fetch(`${DRIVE_API}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}`, ...(intervalo && { Range: intervalo }) },
  });
  if (!res.ok) return new Response(null, { status: 404 });

  const repassar = ["content-type", "content-length", "content-range", "accept-ranges"];
  const h = new Headers({ "Cache-Control": "private, max-age=3600" });
  for (const nome of repassar) {
    const v = res.headers.get(nome);
    if (v) h.set(nome, v);
  }
  if (!h.has("accept-ranges")) h.set("accept-ranges", "bytes");
  return new Response(res.body, { status: res.status, headers: h });
}
