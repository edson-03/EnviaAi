// Lista das fotos visíveis no telão (as que não foram ocultadas pelo dono). Consultada a cada poucos segundos.
import { uploads } from "@/lib/mongodb";
import { albumDoTelao } from "@/lib/telao";

const LIMITE = 300;

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const album = await albumDoTelao(token);
  if (!album) return Response.json({ erro: "Telão não encontrado" }, { status: 404 });

  const lista = await uploads
    .find(
      { albumId: album._id, aprovado: true, mimeType: /^image\// },
      { projection: { driveFileId: 1, nomeConvidado: 1, legenda: 1 } },
    )
    .sort({ createdAt: -1 })
    .limit(LIMITE)
    .toArray();

  return Response.json(
    {
      fotos: lista.reverse().map((u) => ({ id: u.driveFileId, nome: u.nomeConvidado ?? null, recado: u.legenda ?? null })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
