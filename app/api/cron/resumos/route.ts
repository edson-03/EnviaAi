// Tarefa diária (vercel.json): manda o resumo do que chegou depois do último e-mail e ficou sem aviso.
// A Vercel envia "Authorization: Bearer <CRON_SECRET>"; sem o segredo configurado, nada roda.
import type { ObjectId } from "mongodb";
import { albums, uploads } from "@/lib/mongodb";
import { enviarResumoSePreciso } from "@/lib/resumo";

export async function GET(req: Request) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || req.headers.get("authorization") !== `Bearer ${segredo}`) {
    return new Response(null, { status: 401 });
  }

  // Álbuns com envios nas últimas 25 h e o horário do envio mais recente de cada um.
  const recentes = await uploads
    .aggregate<{ _id: ObjectId; ultimo: Date }>([
      { $match: { createdAt: { $gte: new Date(Date.now() - 25 * 60 * 60 * 1000) } } },
      { $group: { _id: "$albumId", ultimo: { $max: "$createdAt" } } },
    ])
    .toArray();

  let enviados = 0;
  for (const r of recentes) {
    const album = await albums.findOne({ _id: r._id }, { projection: { ultimoResumoEm: 1 } });
    if (album && (!album.ultimoResumoEm || r.ultimo > album.ultimoResumoEm)) {
      await enviarResumoSePreciso(r._id, { ignorarIntervalo: true });
      enviados++;
    }
  }

  return Response.json({ albunsVerificados: recentes.length, resumos: enviados });
}
