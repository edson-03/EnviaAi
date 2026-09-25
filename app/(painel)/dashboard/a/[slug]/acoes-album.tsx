"use client";

import { useTransition } from "react";
import { definirAtivo, excluirAlbum } from "./actions";

export function AcoesAlbum({ slug, ativo }: { slug: string; ativo: boolean }) {
  const [pendente, iniciar] = useTransition();

  function excluir() {
    const ok = confirm(
      "Excluir este álbum?\n\nO link e o QR code param de funcionar e a lista de envios some do painel. " +
        "A pasta e todos os arquivos continuam no seu Google Drive.",
    );
    if (ok) iniciar(() => excluirAlbum(slug));
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="cartao p-5">
        <h2 className="flex items-center gap-2 font-semibold">
          <span className={`h-2 w-2 rounded-full ${ativo ? "bg-green-500" : "bg-amber-500"}`} />
          {ativo ? "Recebendo arquivos" : "Álbum pausado"}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {ativo
            ? "Pause para parar de receber envios. Você pode reativar quando quiser."
            : "Os convidados não conseguem enviar arquivos enquanto o álbum estiver pausado."}
        </p>
        <button
          disabled={pendente}
          onClick={() => iniciar(() => definirAtivo(slug, !ativo))}
          className={`${ativo ? "btn-secundario" : "btn-primario"} mt-4 w-full`}
        >
          {ativo ? "Pausar álbum" : "Reativar álbum"}
        </button>
      </section>

      <section className="cartao border-red-200 p-5 dark:border-red-900">
        <h2 className="font-semibold text-red-600 dark:text-red-400">Excluir álbum</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Apaga o álbum e a lista de envios do Enviaí. A pasta e os arquivos continuam no seu Drive.
        </p>
        <button
          disabled={pendente}
          onClick={excluir}
          className="btn-secundario mt-4 w-full text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
        >
          Excluir álbum
        </button>
      </section>
    </div>
  );
}
