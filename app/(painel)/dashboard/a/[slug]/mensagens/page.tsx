import { mensagens, uploads } from "@/lib/mongodb";
import { excluirMensagem } from "../actions";
import { albumDoDono } from "../dados";

const LIMITE = 300;

type Item =
  | { tipo: "mensagem"; id: string; nome?: string; texto?: string; audio?: string; duracao?: number; data: Date }
  | { tipo: "recado"; id: string; nome?: string; texto: string; data: Date };

const quando = (d: Date) =>
  d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });

export default async function MensagensPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { album } = await albumDoDono(slug);

  const [livro, recados] = await Promise.all([
    mensagens.find({ albumId: album._id }).sort({ createdAt: -1 }).limit(LIMITE).toArray(),
    uploads
      .find({ albumId: album._id, legenda: { $exists: true } }, { projection: { legenda: 1, nomeConvidado: 1, createdAt: 1 } })
      .sort({ createdAt: -1 })
      .limit(LIMITE)
      .toArray(),
  ]);

  const itens: Item[] = [
    ...livro.map((m): Item => ({
      tipo: "mensagem",
      id: m._id.toString(),
      nome: m.nome,
      texto: m.texto,
      audio: m.audioDriveFileId,
      duracao: m.duracaoSeg,
      data: m.createdAt,
    })),
    ...recados.map((r): Item => ({ tipo: "recado", id: r._id.toString(), nome: r.nomeConvidado, texto: r.legenda!, data: r.createdAt })),
  ].sort((a, b) => b.data.getTime() - a.data.getTime());

  if (!itens.length) {
    return (
      <div className="cartao px-6 py-14 text-center text-sm text-zinc-500">
        Nenhuma mensagem ainda. Os convidados podem escrever ou gravar um áudio no livro de visitas, na página do álbum.
      </div>
    );
  }

  const audios = livro.filter((m) => m.audioDriveFileId).length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-500">
        {itens.length} {itens.length === 1 ? "mensagem" : "mensagens"}
        {audios > 0 && ` · ${audios} ${audios === 1 ? "áudio" : "áudios"}`} · inclui os recados enviados junto com as fotos
      </p>
      <ul className="grid gap-3 md:grid-cols-2">
        {itens.map((m) => (
          <li key={`${m.tipo}-${m.id}`} className="cartao flex flex-col gap-3 p-4">
            {m.texto && <p className="whitespace-pre-line text-sm leading-relaxed">“{m.texto}”</p>}
            {m.tipo === "mensagem" && m.audio && (
              <audio controls preload="none" src={`/api/audio/${slug}/${encodeURIComponent(m.audio)}`} className="w-full" />
            )}
            <div className="flex items-center justify-between gap-2 text-xs text-zinc-500">
              <span>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">{m.nome ?? "Anônimo"}</span> · {quando(m.data)}
                {m.tipo === "recado" && " · recado com fotos"}
                {m.tipo === "mensagem" && m.audio && m.duracao ? ` · ${m.duracao}s` : ""}
              </span>
              {m.tipo === "mensagem" && (
                <form action={excluirMensagem.bind(null, slug, m.id)}>
                  <button className="text-zinc-400 hover:text-red-600" title="Excluir mensagem">
                    Excluir
                  </button>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
