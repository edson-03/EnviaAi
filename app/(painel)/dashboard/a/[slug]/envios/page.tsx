import Link from "next/link";
import type { Filter } from "mongodb";
import { formatarBytes } from "@/lib/formatar";
import { uploads, type Upload } from "@/lib/mongodb";
import { definirVisivelNoTelao } from "../actions";
import { albumDoDono } from "../dados";
import { Miniatura } from "./miniatura";

const LIMITE = 200;

const FILTROS = [
  { id: "", rotulo: "Todos" },
  { id: "fotos", rotulo: "Fotos" },
  { id: "videos", rotulo: "Vídeos" },
  { id: "ocultas", rotulo: "Ocultas" },
] as const;

export default async function EnviosPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tipo?: string }>;
}) {
  const [{ slug }, { tipo = "" }] = await Promise.all([params, searchParams]);
  const { album } = await albumDoDono(slug);

  const filtro: Filter<Upload> = { albumId: album._id };
  if (tipo === "fotos") filtro.mimeType = /^image\//;
  if (tipo === "videos") filtro.mimeType = /^video\//;
  if (tipo === "ocultas") filtro.aprovado = false;

  const [totalAlbum, total, lista] = await Promise.all([
    uploads.countDocuments({ albumId: album._id }),
    uploads.countDocuments(filtro),
    uploads.find(filtro).sort({ createdAt: -1 }).limit(LIMITE).toArray(),
  ]);

  if (totalAlbum === 0) {
    return (
      <div className="cartao px-6 py-14 text-center text-sm text-zinc-500">
        Nenhum arquivo recebido ainda. Compartilhe o link ou o QR code com os convidados.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
          {FILTROS.map((f) => (
            <Link
              key={f.id}
              href={f.id ? `?tipo=${f.id}` : "?"}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                tipo === f.id ? "bg-white shadow-sm dark:bg-zinc-900" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              {f.rotulo}
            </Link>
          ))}
        </div>
        <p className="text-sm text-zinc-500">
          {total.toLocaleString("pt-BR")} {total === 1 ? "arquivo" : "arquivos"}
          {total > LIMITE && ` · mostrando os ${LIMITE} mais recentes`}
        </p>
      </div>

      {lista.length === 0 ? (
        <div className="cartao px-6 py-14 text-center text-sm text-zinc-500">Nada por aqui neste filtro.</div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {lista.map((u) => {
            const video = u.mimeType.startsWith("video/");
            return (
              <li key={u.driveFileId} className="cartao group overflow-hidden">
                <div className={`relative aspect-square bg-zinc-100 dark:bg-zinc-800 ${u.aprovado ? "" : "opacity-40"}`}>
                  <Miniatura src={`/api/miniatura/${slug}/${encodeURIComponent(u.driveFileId)}`} video={video} />
                  {video && (
                    <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
                      ▶ vídeo
                    </span>
                  )}
                  {!u.aprovado && (
                    <span className="absolute right-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">
                      Oculta
                    </span>
                  )}
                  <a
                    href={`https://drive.google.com/file/d/${u.driveFileId}/view`}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute inset-0"
                    aria-label={`Abrir ${u.nomeArquivo} no Drive`}
                  />
                </div>

                <div className="p-2.5">
                  <p className="truncate text-sm font-medium" title={u.nomeConvidado ?? "Anônimo"}>
                    {u.nomeConvidado ?? "Anônimo"}
                    {u.legenda && (
                      <span className="ml-1 inline-block align-[-2px] text-violet-600" title={`Recado: ${u.legenda}`}>
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-label="Tem recado">
                          <path d="M4 5h16v11H9l-5 4z" strokeLinejoin="round" />
                        </svg>
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {u.createdAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })} ·{" "}
                    {formatarBytes(u.tamanhoBytes)}
                  </p>
                  {!video && (
                    <form action={definirVisivelNoTelao.bind(null, slug, u.driveFileId, !u.aprovado)} className="mt-2">
                      <button
                        className={`w-full rounded-md px-2 py-1 text-xs font-medium transition ${
                          u.aprovado
                            ? "bg-zinc-100 text-zinc-600 hover:bg-red-50 hover:text-red-600 dark:bg-zinc-800 dark:text-zinc-300"
                            : "bg-amber-100 text-amber-800 hover:bg-green-50 hover:text-green-700 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {u.aprovado ? "Ocultar do telão" : "Mostrar no telão"}
                      </button>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
