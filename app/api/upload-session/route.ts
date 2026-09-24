// Pública: cria sessão resumable no Drive do dono do álbum, já dentro da pasta do álbum.
// O navegador do convidado envia o arquivo direto ao Drive com a URL devolvida.
import { albums, uploads } from "@/lib/mongodb";
import { DriveDesconectado, obterAccessToken } from "@/lib/google";
import { excedeuLimite, ipDaRequisicao } from "@/lib/rate-limit";
import {
  JANELA_LIMITE_MS,
  LIMITE_REQUISICOES_IP,
  MAX_ARQUIVOS_POR_ALBUM,
  MAX_FILE_BYTES,
  tipoPermitido,
} from "@/lib/upload-limits";

export async function POST(req: Request) {
  if (await excedeuLimite(`upload-session:${ipDaRequisicao(req)}`, LIMITE_REQUISICOES_IP, JANELA_LIMITE_MS)) {
    return Response.json({ erro: "Muitos envios seguidos, aguarde alguns minutos" }, { status: 429 });
  }

  const { slug, fileName, mimeType, size, nomeConvidado } = await req.json();

  if (
    typeof slug !== "string" ||
    typeof fileName !== "string" ||
    typeof mimeType !== "string" ||
    !Number.isSafeInteger(size) ||
    (nomeConvidado !== undefined && (typeof nomeConvidado !== "string" || nomeConvidado.length > 80))
  ) {
    return Response.json({ erro: "Dados inválidos" }, { status: 400 });
  }
  if (!tipoPermitido(mimeType)) {
    return Response.json({ erro: "Só fotos e vídeos" }, { status: 400 });
  }
  if (size <= 0 || size > MAX_FILE_BYTES) {
    return Response.json({ erro: "Arquivo muito grande" }, { status: 400 });
  }

  const album = await albums.findOne({ slug, ativo: true }, { projection: { ownerId: 1, driveFolderId: 1 } });
  if (!album) return Response.json({ erro: "Álbum não encontrado" }, { status: 404 });
  if ((await uploads.countDocuments({ albumId: album._id })) >= MAX_ARQUIVOS_POR_ALBUM) {
    return Response.json({ erro: "Este álbum atingiu o limite de arquivos" }, { status: 403 });
  }

  let token: string;
  try {
    token = await obterAccessToken(album.ownerId.toString());
  } catch (e) {
    if (e instanceof DriveDesconectado) {
      return Response.json({ erro: "O álbum não está recebendo arquivos no momento" }, { status: 503 });
    }
    throw e;
  }

  // O Drive libera CORS na URL da sessão para a origem informada aqui.
  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL!;

  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Type": mimeType,
      "X-Upload-Content-Length": String(size),
      Origin: origin,
    },
    body: JSON.stringify({
      name: fileName.slice(0, 200),
      parents: [album.driveFolderId],
      ...(nomeConvidado && { description: `Enviado por ${nomeConvidado}` }),
    }),
  });

  const uploadUrl = res.headers.get("location");
  if (!res.ok || !uploadUrl) {
    console.error("Drive recusou a sessão", res.status, await res.text());
    return Response.json({ erro: "Não foi possível iniciar o envio" }, { status: 502 });
  }

  return Response.json({ uploadUrl });
}
