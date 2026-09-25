// Resumo por e-mail dos arquivos novos de um álbum: no máximo 1 por hora por álbum. Somente servidor.
import type { ObjectId } from "mongodb";
import { enviarEmail, escaparHtml } from "./email";
import { albums, db, uploads } from "./mongodb";

const INTERVALO_MS = 60 * 60 * 1000; // 1 hora
const MAX_RECADOS = 3;

// "ignorarIntervalo" é usado pela tarefa diária para mandar o que sobrou.
export async function enviarResumoSePreciso(albumId: ObjectId, { ignorarIntervalo = false } = {}) {
  const agora = new Date();

  // Reserva o envio de forma atômica (evita dois e-mails quando chegam arquivos ao mesmo tempo).
  const condicao = ignorarIntervalo
    ? {}
    : { $or: [{ ultimoResumoEm: { $exists: false } }, { ultimoResumoEm: { $lte: new Date(agora.getTime() - INTERVALO_MS) } }] };
  const album = await albums.findOneAndUpdate(
    { _id: albumId, suspenso: { $ne: true }, ...condicao },
    { $set: { ultimoResumoEm: agora } },
    { projection: { titulo: 1, slug: 1, ownerId: 1, createdAt: 1, ultimoResumoEm: 1 } }, // devolve o valor ANTERIOR
  );
  if (!album) return;

  const desde = album.ultimoResumoEm ?? album.createdAt;
  const novos = await uploads
    .find({ albumId, createdAt: { $gt: desde, $lte: agora } }, { projection: { mimeType: 1, nomeConvidado: 1, legenda: 1 } })
    .toArray();
  if (!novos.length) return;

  const dono = await db
    .collection("user")
    .findOne({ _id: album.ownerId }, { projection: { email: 1, name: 1, resumoEmail: 1, suspenso: 1 } });
  if (!dono?.email || dono.resumoEmail === false || dono.suspenso) return;

  const videos = novos.filter((u) => u.mimeType.startsWith("video/")).length;
  const fotos = novos.length - videos;
  const nomes = [...new Set(novos.map((u) => u.nomeConvidado?.trim()).filter(Boolean))] as string[];
  const recados = novos.filter((u) => u.legenda).slice(0, MAX_RECADOS);
  const link = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/a/${album.slug}/envios`;

  const partes = [fotos && `${fotos} ${fotos === 1 ? "foto" : "fotos"}`, videos && `${videos} ${videos === 1 ? "vídeo" : "vídeos"}`]
    .filter(Boolean)
    .join(" e ");
  const assunto = `${novos.length} ${novos.length === 1 ? "arquivo novo" : "arquivos novos"} em ${album.titulo}`;

  const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#18181b">
  <p style="font-size:20px;font-weight:bold;margin:0 0 4px">Envia<span style="color:#7c3aed">í</span></p>
  <h1 style="font-size:22px;margin:24px 0 8px">Chegaram ${escaparHtml(partes)} no álbum ${escaparHtml(album.titulo)}</h1>
  ${
    nomes.length
      ? `<p style="margin:0 0 16px;color:#52525b">Enviado por ${escaparHtml(nomes.slice(0, 8).join(", "))}${nomes.length > 8 ? ` e mais ${nomes.length - 8}` : ""}.</p>`
      : ""
  }
  ${recados
    .map(
      (r) =>
        `<blockquote style="margin:0 0 12px;padding:12px 16px;background:#f4f4f5;border-left:4px solid #7c3aed;border-radius:8px">“${escaparHtml(r.legenda!)}”<br><span style="font-size:13px;color:#71717a">${escaparHtml(r.nomeConvidado ?? "Anônimo")}</span></blockquote>`,
    )
    .join("")}
  <p style="margin:24px 0"><a href="${link}" style="background:#7c3aed;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold">Ver no painel</a></p>
  <p style="font-size:12px;color:#a1a1aa;margin-top:32px">Você recebe no máximo um resumo por hora de cada álbum. Para parar, desligue em “Sua conta” no painel do Enviaí.</p>
</div>`;

  // Falhou (sem chave, domínio não verificado...): desfaz a reserva para o próximo resumo incluir estes arquivos.
  if (!(await enviarEmail(dono.email, assunto, html))) {
    await albums.updateOne(
      { _id: albumId, ultimoResumoEm: agora },
      album.ultimoResumoEm ? { $set: { ultimoResumoEm: album.ultimoResumoEm } } : { $unset: { ultimoResumoEm: 1 } },
    );
  }
}
