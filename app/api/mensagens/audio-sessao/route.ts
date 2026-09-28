// Pública: sessão de envio para uma mensagem de voz do livro de visitas (vai para a pasta do álbum no Drive).
import { excedeuLimite, ipDaRequisicao } from "@/lib/rate-limit";
import { albumQueRecebe, criarSessaoNoDrive } from "@/lib/recebimento";
import { JANELA_LIMITE_MS, LIMITE_REQUISICOES_IP } from "@/lib/upload-limits";

const MAX_AUDIO_BYTES = 15 * 1024 * 1024; // ~60 s de áudio sobram com folga

const EXTENSAO: Record<string, string> = { "audio/webm": "webm", "audio/mp4": "m4a", "audio/ogg": "ogg", "audio/mpeg": "mp3" };

export async function POST(req: Request) {
  if (await excedeuLimite(`audio-sessao:${ipDaRequisicao(req)}`, LIMITE_REQUISICOES_IP, JANELA_LIMITE_MS)) {
    return Response.json({ erro: "Muitos envios seguidos, aguarde alguns minutos" }, { status: 429 });
  }

  const { slug, mimeType, size, nome } = await req.json();
  const tipo = typeof mimeType === "string" ? mimeType.split(";")[0].trim() : "";
  if (
    typeof slug !== "string" ||
    !EXTENSAO[tipo] ||
    !Number.isSafeInteger(size) ||
    size <= 0 ||
    size > MAX_AUDIO_BYTES ||
    (nome !== undefined && (typeof nome !== "string" || nome.length > 80))
  ) {
    return Response.json({ erro: "Áudio inválido" }, { status: 400 });
  }

  const recebe = await albumQueRecebe(slug);
  if (!recebe.ok) return recebe.resposta;

  const quem = (nome as string | undefined)?.trim() || "Convidado";
  const sessao = await criarSessaoNoDrive(req, recebe.album, {
    nome: `Mensagem de voz - ${quem}.${EXTENSAO[tipo]}`,
    mimeType: tipo,
    size,
    descricao: `Mensagem de voz do livro de visitas, de ${quem}`,
  });
  if (!sessao.ok) return sessao.resposta;
  return Response.json({ uploadUrl: sessao.uploadUrl });
}
