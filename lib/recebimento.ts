// Regras comuns das rotas públicas que recebem conteúdo dos convidados (fotos, vídeos, mensagens).
// Somente servidor.
import { DriveDesconectado, obterAccessToken } from "./google";
import { albums, db } from "./mongodb";
import { situacaoDoAlbum } from "./planos";

const erro = (mensagem: string, status: number) => ({ ok: false as const, resposta: Response.json({ erro: mensagem }, { status }) });

// Álbum que pode receber agora (existe, não suspenso, ativo e dentro do prazo do plano) + plano valendo.
export async function albumQueRecebe(slug: string) {
  const album = await albums.findOne(
    { slug },
    { projection: { ownerId: 1, driveFolderId: 1, ativo: 1, suspenso: 1, createdAt: 1, planoContratado: 1, planoExpiraEm: 1 } },
  );
  if (!album) return erro("Álbum não encontrado", 404);
  const dono = await db.collection("user").findOne({ _id: album.ownerId }, { projection: { suspenso: 1, plano: 1 } });
  if (album.suspenso || dono?.suspenso) return erro("Este álbum está indisponível", 403);
  if (!album.ativo) return erro("Este álbum não está recebendo arquivos no momento", 403);

  const { plano, prazoEncerrado } = await situacaoDoAlbum(album, (dono?.plano as string | undefined) ?? null);
  if (prazoEncerrado) return erro("O prazo deste álbum para receber arquivos terminou", 403);
  return { ok: true as const, album, plano };
}

// Cria a sessão resumable no Drive do dono, dentro da pasta do álbum. O navegador envia direto ao Drive.
export async function criarSessaoNoDrive(
  req: Request,
  album: { ownerId: { toString(): string }; driveFolderId: string },
  arquivo: { nome: string; mimeType: string; size: number; descricao?: string },
) {
  let token: string;
  try {
    token = await obterAccessToken(album.ownerId.toString());
  } catch (e) {
    if (e instanceof DriveDesconectado) return erro("O álbum não está recebendo arquivos no momento", 503);
    throw e;
  }

  // O Drive libera CORS na URL da sessão para a origem informada aqui.
  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL!;

  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Type": arquivo.mimeType,
      "X-Upload-Content-Length": String(arquivo.size),
      Origin: origin,
    },
    body: JSON.stringify({
      name: arquivo.nome.slice(0, 200),
      parents: [album.driveFolderId],
      ...(arquivo.descricao && { description: arquivo.descricao }),
    }),
  });

  const uploadUrl = res.headers.get("location");
  if (!res.ok || !uploadUrl) {
    const corpo = await res.text();
    // O Drive recusa já na criação da sessão quando o arquivo não cabe no espaço livre.
    if (res.status === 403 && corpo.includes("storageQuotaExceeded")) {
      return erro("O álbum não tem mais espaço para receber arquivos", 507);
    }
    console.error("Drive recusou a sessão", res.status, corpo);
    return erro("Não foi possível iniciar o envio", 502);
  }
  return { ok: true as const, uploadUrl };
}
