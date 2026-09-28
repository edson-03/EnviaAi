// Pública: grava uma mensagem do livro de visitas (texto e/ou áudio já enviado ao Drive).
// Não confia no cliente: o áudio precisa existir na pasta do álbum.
import { MongoServerError, ObjectId } from "mongodb";
import { DRIVE_API, DriveDesconectado, obterAccessToken } from "@/lib/google";
import { mensagens } from "@/lib/mongodb";
import { excedeuLimite, ipDaRequisicao } from "@/lib/rate-limit";
import { albumQueRecebe } from "@/lib/recebimento";
import { JANELA_LIMITE_MS, LIMITE_REQUISICOES_IP } from "@/lib/upload-limits";

export async function POST(req: Request) {
  if (await excedeuLimite(`mensagens:${ipDaRequisicao(req)}`, LIMITE_REQUISICOES_IP, JANELA_LIMITE_MS)) {
    return Response.json({ erro: "Muitas mensagens seguidas, aguarde alguns minutos" }, { status: 429 });
  }

  const { slug, nome, texto, audioFileId, duracaoSeg } = await req.json();
  const textoLimpo = typeof texto === "string" ? texto.trim() : "";
  if (
    typeof slug !== "string" ||
    (nome !== undefined && (typeof nome !== "string" || nome.length > 80)) ||
    (texto !== undefined && typeof texto !== "string") ||
    textoLimpo.length > 1000 ||
    (audioFileId !== undefined && (typeof audioFileId !== "string" || !/^[\w-]{10,100}$/.test(audioFileId))) ||
    (duracaoSeg !== undefined && (typeof duracaoSeg !== "number" || duracaoSeg < 0 || duracaoSeg > 600)) ||
    (!textoLimpo && !audioFileId)
  ) {
    return Response.json({ erro: "Mensagem inválida" }, { status: 400 });
  }

  const recebe = await albumQueRecebe(slug);
  if (!recebe.ok) return recebe.resposta;
  const { album } = recebe;

  if (audioFileId) {
    let token: string;
    try {
      token = await obterAccessToken(album.ownerId.toString());
    } catch (e) {
      if (e instanceof DriveDesconectado) {
        return Response.json({ erro: "O álbum não está recebendo arquivos no momento" }, { status: 503 });
      }
      throw e;
    }
    const res = await fetch(`${DRIVE_API}/files/${audioFileId}?fields=mimeType,parents,trashed`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const f = res.ok ? ((await res.json()) as { mimeType: string; parents?: string[]; trashed: boolean }) : null;
    if (!f || f.trashed || !f.mimeType.startsWith("audio/") || !f.parents?.includes(album.driveFolderId)) {
      return Response.json({ erro: "Áudio não encontrado no álbum" }, { status: 400 });
    }
  }

  try {
    await mensagens.insertOne({
      _id: new ObjectId(),
      albumId: album._id,
      ...((nome as string | undefined)?.trim() && { nome: (nome as string).trim() }),
      ...(textoLimpo && { texto: textoLimpo }),
      ...(audioFileId && { audioDriveFileId: audioFileId, duracaoSeg: Math.round(duracaoSeg ?? 0) }),
      createdAt: new Date(),
    });
  } catch (e) {
    // Mesmo áudio registrado duas vezes (chamada repetida): tudo certo.
    if (!(e instanceof MongoServerError && e.code === 11000)) throw e;
  }
  return Response.json({ ok: true });
}
