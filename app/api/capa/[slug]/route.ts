// Pública: entrega a foto de capa do álbum, lida do Drive do dono. O arquivo continua privado no Drive.
// A URL leva ?v=<id do arquivo>, então pode ficar em cache por muito tempo.
import { baixarArquivo } from "@/lib/google";
import { albums } from "@/lib/mongodb";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const album = await albums.findOne({ slug }, { projection: { ownerId: 1, capaDriveFileId: 1 } });
  if (!album?.capaDriveFileId) return new Response(null, { status: 404 });

  try {
    const res = await baixarArquivo(album.ownerId.toString(), album.capaDriveFileId);
    const tipo = res.headers.get("content-type") ?? "";
    if (!res.ok || !tipo.startsWith("image/")) return new Response(null, { status: 404 });
    return new Response(res.body, {
      headers: { "Content-Type": tipo, "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
