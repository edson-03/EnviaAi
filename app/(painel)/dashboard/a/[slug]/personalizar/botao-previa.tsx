"use client";

import { useRef, useState } from "react";

// Abre a página real dos convidados (modo prévia, envios desativados) numa moldura de celular ou de computador.
export function BotaoPrevia({ slug, className = "btn-primario" }: { slug: string; className?: string }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [aberta, setAberta] = useState(false);
  const [versao, setVersao] = useState(0); // muda a cada abertura: recarrega com a cor/capa mais recentes
  const [tela, setTela] = useState<"celular" | "computador">("celular");
  const url = `/a/${slug}?previa=1&v=${versao}`;

  function abrir() {
    setVersao(Date.now());
    setAberta(true);
    dialogo.current?.showModal();
  }

  function fechar() {
    dialogo.current?.close();
  }

  return (
    <>
      <button type="button" onClick={abrir} className={className}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        Ver prévia
      </button>

      <dialog
        ref={dialogo}
        onClose={() => setAberta(false)}
        onClick={(e) => e.target === dialogo.current && fechar()} // clique fora fecha
        aria-label="Prévia da página dos convidados"
        className="m-auto h-[94vh] w-[min(1100px,96vw)] max-w-none rounded-2xl bg-zinc-100 p-0 text-zinc-900 shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm dark:bg-zinc-900 dark:text-zinc-100"
      >
        <div className="flex h-full flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <p className="font-semibold">Prévia da página dos convidados</p>
            <div className="flex items-center gap-2">
              <div className="flex gap-1 rounded-lg bg-zinc-200 p-1 text-sm dark:bg-zinc-800">
                {(["celular", "computador"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTela(t)}
                    aria-pressed={tela === t}
                    className={`rounded-md px-3 py-1 font-medium ${tela === t ? "bg-white shadow-sm dark:bg-zinc-950" : "text-zinc-500"}`}
                  >
                    {t === "celular" ? "Celular" : "Computador"}
                  </button>
                ))}
              </div>
              <a href={`/a/${slug}?previa=1`} target="_blank" rel="noreferrer" className="hidden text-sm text-zinc-500 underline hover:text-violet-600 sm:inline">
                Abrir em nova aba
              </a>
              <button type="button" onClick={fechar} className="btn-secundario px-3 py-1.5" aria-label="Fechar prévia">
                Fechar
              </button>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center overflow-auto p-4">
            {aberta &&
              (tela === "celular" ? (
                <div className="h-[min(780px,100%)] w-[390px] max-w-full shrink-0 overflow-hidden rounded-[2.6rem] border-[10px] border-zinc-900 bg-white shadow-xl">
                  <iframe key={url} src={url} title="Prévia no celular" className="h-full w-full" />
                </div>
              ) : (
                <div className="h-full w-full overflow-hidden rounded-xl border border-zinc-300 bg-white shadow-xl dark:border-zinc-700">
                  <iframe key={url} src={url} title="Prévia no computador" className="h-full w-full" />
                </div>
              ))}
          </div>
        </div>
      </dialog>
    </>
  );
}
