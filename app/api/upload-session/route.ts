// Pública: cria sessão resumable no Drive do dono do álbum, já dentro da pasta do álbum.
// O navegador do convidado envia o arquivo direto ao Drive com a URL devolvida.
import { uploads } from "@/lib/mongodb";
import { formatarTamanho } from "@/lib/planos";
import { excedeuLimite, ipDaRequisicao } from "@/lib/rate-limit";
import { albumQueRecebe, criarSessaoNoDrive } from "@/lib/recebimento";
import { JANELA_LIMITE_MS, LIMITE_REQUISICOES_IP, MAX_FILE_BYTES, tipoPermitido } from "@/lib/upload-limits";

export async function POST(req: Request) {
  if (await excedeuLimite(`upload-session:${ipDaRequisicao(req)}`, LIMITE_REQUISICOES_IP, JANELA_LIMITE_MS)) {
    return Response.json({ erro: "Muitos envios seguidos, aguarde alguns minutos" }, { status: 429 });
  }

  const { slug, fileName, mimeType, size, nomeConvidado, recado } = await req.json();

  if (
    typeof slug !== "string" ||
    typeof fileName !== "string" ||
    typeof mimeType !== "string" ||
    !Number.isSafeInteger(size) ||
    (nomeConvidado !== undefined && (typeof nomeConvidado !== "string" || nomeConvidado.length > 80)) ||
    (recado !== undefined && (typeof recado !== "string" || recado.length > 500))
  ) {
    return Response.json({ erro: "Dados inválidos" }, { status: 400 });
  }
  if (!tipoPermitido(mimeType)) {
    return Response.json({ erro: "Só fotos e vídeos" }, { status: 400 });
  }
  if (size <= 0 || size > MAX_FILE_BYTES) {
    return Response.json({ erro: "Arquivo muito grande" }, { status: 400 });
  }

  const recebe = await albumQueRecebe(slug);
  if (!recebe.ok) return recebe.resposta;
  const { album, plano } = recebe;

  // Regras do plano do álbum: tamanho por arquivo e quantidade.
  if (size > plano.maxBytesArquivo) {
    return Response.json({ erro: `Arquivo muito grande (máx. ${formatarTamanho(plano.maxBytesArquivo)})` }, { status: 400 });
  }
  if ((await uploads.countDocuments({ albumId: album._id })) >= plano.limiteArquivos) {
    return Response.json({ erro: "Este álbum atingiu o limite de arquivos" }, { status: 403 });
  }

  const sessao = await criarSessaoNoDrive(req, album, {
    nome: fileName,
    mimeType,
    size,
    descricao: [nomeConvidado && `Enviado por ${nomeConvidado}`, recado && `Recado: ${recado}`].filter(Boolean).join("\n"),
  });
  if (!sessao.ok) return sessao.resposta;
  return Response.json({ uploadUrl: sessao.uploadUrl });
}
