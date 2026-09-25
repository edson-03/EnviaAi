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
    <section className="cartao mt-8 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="font-semibold">{ativo ? "Recebendo arquivos" : "Álbum pausado"}</h2>
        <p className="mt-1 text-sm text-zinc-500">
          {ativo
            ? "Pause para parar de receber envios. Você pode reativar quando quiser."
            : "Os convidados não conseguem enviar arquivos enquanto o álbum estiver pausado."}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <button
          disabled={pendente}
          onClick={() => iniciar(() => definirAtivo(slug, !ativo))}
          className={ativo ? "btn-secundario" : "btn-primario"}
        >
          {ativo ? "Pausar álbum" : "Reativar álbum"}
        </button>
        <button
          disabled={pendente}
          onClick={excluir}
          className="btn-secundario text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
        >
          Excluir
        </button>
      </div>
    </section>
  );
}
