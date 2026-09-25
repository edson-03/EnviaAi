// Miniatura de uma foto do telão, lida do Drive do dono (o arquivo continua privado).
// A CDN da Vercel guarda a resposta, então cada foto sai do Drive poucas vezes.
import { baixarMiniatura } from "@/lib/google";
import { uploads } from "@/lib/mongodb";
import { albumDoTelao, LADO_MINIATURA_TELAO } from "@/lib/telao";

export async function GET(_: Request, { params }: { params: Promise<{ token: string; fileId: string }> }) {
  const { token, fileId } = await params;
  const album = await albumDoTelao(token);
  if (!album) return new Response(null, { status: 404 });

  const visivel = await uploads.countDocuments(
    { albumId: album._id, driveFileId: fileId, aprovado: true, mimeType: /^image\// },
    { limit: 1 },
  );
  if (!visivel) return new Response(null, { status: 404 });

  try {
    const res = await baixarMiniatura(album.ownerId.toString(), fileId, LADO_MINIATURA_TELAO);
    // Sem miniatura ainda (foto recém-chegada): o telão tenta de novo na próxima rodada.
    if (!res) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
    return new Response(res.body, {
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch {
    return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
}
