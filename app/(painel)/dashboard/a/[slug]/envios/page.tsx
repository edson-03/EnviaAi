import { formatarBytes } from "@/lib/formatar";
import { uploads } from "@/lib/mongodb";
import { definirVisivelNoTelao } from "../actions";
import { albumDoDono } from "../dados";

const LIMITE_LISTA = 200;

export default async function EnviosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { album } = await albumDoDono(slug);

  const [total, lista] = await Promise.all([
    uploads.countDocuments({ albumId: album._id }),
    uploads.find({ albumId: album._id }).sort({ createdAt: -1 }).limit(LIMITE_LISTA).toArray(),
  ]);

  if (lista.length === 0) {
    return (
      <div className="cartao px-6 py-14 text-center text-sm text-zinc-500">
        Nenhum arquivo recebido ainda. Compartilhe o link ou o QR code com os convidados.
      </div>
    );
  }

  return (
    <>
      <ul className="cartao divide-y divide-zinc-100 dark:divide-zinc-800">
        {lista.map((u) => (
          <li key={u.driveFileId} className="flex items-center gap-3 px-4 py-3 text-sm">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${
                u.mimeType.startsWith("video/")
                  ? "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
                  : "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
              }`}
            >
              {u.mimeType.startsWith("video/") ? "VÍDEO" : "FOTO"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{u.nomeArquivo}</p>
              <p className="truncate text-xs text-zinc-500">
                {[
                  u.nomeConvidado ?? "Anônimo",
                  formatarBytes(u.tamanhoBytes),
                  u.createdAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }),
                ].join(" · ")}
              </p>
              {u.legenda && <p className="mt-1 truncate text-xs italic text-zinc-600 dark:text-zinc-400">“{u.legenda}”</p>}
            </div>
            {u.mimeType.startsWith("image/") && (
              <form action={definirVisivelNoTelao.bind(null, slug, u.driveFileId, !u.aprovado)} className="shrink-0">
                <button
                  title={u.aprovado ? "Esta foto aparece no telão" : "Esta foto não aparece no telão"}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                    u.aprovado
                      ? "bg-zinc-100 text-zinc-600 hover:bg-red-50 hover:text-red-600 dark:bg-zinc-800 dark:text-zinc-300"
                      : "bg-amber-100 text-amber-800 hover:bg-green-50 hover:text-green-700 dark:bg-amber-950 dark:text-amber-300"
                  }`}
                >
                  {u.aprovado ? "Ocultar do telão" : "Oculta · mostrar"}
                </button>
              </form>
            )}
            <a
              href={`https://drive.google.com/file/d/${u.driveFileId}/view`}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-sm font-medium text-violet-600 hover:text-violet-700"
            >
              Ver ↗
            </a>
          </li>
        ))}
      </ul>
      {total > LIMITE_LISTA && (
        <p className="mt-2 text-xs text-zinc-500">
          Mostrando os {LIMITE_LISTA} mais recentes de {total.toLocaleString("pt-BR")}. Todos estão no Drive.
        </p>
      )}
    </>
  );
}
