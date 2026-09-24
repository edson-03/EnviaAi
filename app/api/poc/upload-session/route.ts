// Etapa 0 (prova de conceito): cria sessão resumable no Drive do usuário logado.
// Será substituída por /api/upload-session (pública, por álbum) na Etapa 6.
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { DriveDesconectado, obterAccessToken } from "@/lib/google";
import { MAX_FILE_BYTES, tipoPermitido } from "@/lib/upload-limits";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ erro: "Faça login em /entrar" }, { status: 401 });

  const { fileName, mimeType, size } = await req.json();

  if (typeof fileName !== "string" || typeof mimeType !== "string" || typeof size !== "number") {
    return Response.json({ erro: "Dados inválidos" }, { status: 400 });
  }
  if (!tipoPermitido(mimeType)) {
    return Response.json({ erro: "Só fotos e vídeos" }, { status: 400 });
  }
  if (size <= 0 || size > MAX_FILE_BYTES) {
    return Response.json({ erro: "Arquivo muito grande" }, { status: 400 });
  }

  let token: string;
  try {
    token = await obterAccessToken(session.user.id);
  } catch (e) {
    if (e instanceof DriveDesconectado) {
      return Response.json({ erro: "Drive desconectado" }, { status: 409 });
    }
    throw e;
  }

  // O Drive libera CORS na URL da sessão para a origem informada aqui.
  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL!;

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": mimeType,
        "X-Upload-Content-Length": String(size),
        Origin: origin,
      },
      body: JSON.stringify({ name: fileName }),
    },
  );

  const uploadUrl = res.headers.get("location");
  if (!res.ok || !uploadUrl) {
    console.error("Drive recusou a sessão", res.status, await res.text());
    return Response.json({ erro: "Não foi possível iniciar o envio" }, { status: 502 });
  }

  return Response.json({ uploadUrl });
}
