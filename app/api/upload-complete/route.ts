// Pública: registra um upload concluído. Não confia no cliente: busca o arquivo no
// Drive com o token do dono e confere se está na pasta do álbum antes de gravar.
import { MongoServerError, ObjectId } from "mongodb";
import { after } from "next/server";
import { enviarResumoSePreciso } from "@/lib/resumo";
import { albums, uploads } from "@/lib/mongodb";
import { DRIVE_API, DriveDesconectado, obterAccessToken } from "@/lib/google";
import { excedeuLimite, ipDaRequisicao } from "@/lib/rate-limit";
import { JANELA_LIMITE_MS, LIMITE_REQUISICOES_IP, tipoPermitido } from "@/lib/upload-limits";

export async function POST(req: Request) {
  if (await excedeuLimite(`upload-complete:${ipDaRequisicao(req)}`, LIMITE_REQUISICOES_IP, JANELA_LIMITE_MS)) {
    return Response.json({ erro: "Muitas requisições, aguarde alguns minutos" }, { status: 429 });
  }

  const { slug, fileId, nomeConvidado, recado } = await req.json();

  if (
    typeof slug !== "string" ||
    typeof fileId !== "string" ||
    !/^[\w-]{10,100}$/.test(fileId) ||
    (nomeConvidado !== undefined && (typeof nomeConvidado !== "string" || nomeConvidado.length > 80)) ||
    (recado !== undefined && (typeof recado !== "string" || recado.length > 500))
  ) {
    return Response.json({ erro: "Dados inválidos" }, { status: 400 });
  }

  // Sem filtrar por "ativo": um envio que terminou logo depois da pausa já está no Drive e deve ser registrado.
  const album = await albums.findOne({ slug }, { projection: { ownerId: 1, driveFolderId: 1 } });
  if (!album) return Response.json({ erro: "Álbum não encontrado" }, { status: 404 });

  let token: string;
  try {
    token = await obterAccessToken(album.ownerId.toString());
  } catch (e) {
    if (e instanceof DriveDesconectado) return Response.json({ erro: "Drive desconectado" }, { status: 503 });
    throw e;
  }

  const res = await fetch(`${DRIVE_API}/files/${fileId}?fields=id,name,mimeType,size,parents,trashed`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  // 404 = não existe ou não foi criado pelo app (drive.file só enxerga os arquivos do app).
  if (res.status === 404) return Response.json({ erro: "Arquivo não encontrado" }, { status: 400 });
  if (!res.ok) throw new Error(`Drive files.get falhou: ${res.status}`);

  const file: { id: string; name: string; mimeType: string; size?: string; parents?: string[]; trashed: boolean } =
    await res.json();
  if (file.trashed || !file.parents?.includes(album.driveFolderId) || !tipoPermitido(file.mimeType)) {
    return Response.json({ erro: "Arquivo não pertence ao álbum" }, { status: 400 });
  }

  try {
    await uploads.insertOne({
      _id: new ObjectId(),
      albumId: album._id,
      driveFileId: file.id,
      nomeArquivo: file.name,
      mimeType: file.mimeType,
      tamanhoBytes: Number(file.size ?? 0),
      ...(nomeConvidado?.trim() && { nomeConvidado: nomeConvidado.trim() }),
      ...(recado?.trim() && { legenda: recado.trim() }),
      aprovado: true,
      createdAt: new Date(),
    });
  } catch (e) {
    // Já registrado (driveFileId único): chamada repetida, tudo certo.
    if (!(e instanceof MongoServerError && e.code === 11000)) throw e;
  }

  // Depois de responder: talvez manda o resumo por e-mail ao dono (no máximo 1 por hora).
  after(() => enviarResumoSePreciso(album._id).catch((e) => console.error("Falha no resumo por e-mail", e)));

  return Response.json({ ok: true });
}
