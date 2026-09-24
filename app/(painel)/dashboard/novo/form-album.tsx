"use client";

import { useActionState } from "react";
import { criarAlbum } from "./actions";
import { TIPOS_EVENTO } from "./tipos-evento";

export function FormAlbum() {
  const [estado, acao, enviando] = useActionState(criarAlbum, {});

  return (
    <form action={acao} className="mt-6 flex flex-col gap-5">
      <label className="rotulo">
        Nome do evento
        <input name="titulo" required maxLength={120} placeholder="Casamento Ana e Léo" className="campo" />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="rotulo">
          Tipo de evento (opcional)
          <select name="tipoEvento" defaultValue="" className="campo">
            <option value="">Selecione</option>
            {TIPOS_EVENTO.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>

        <label className="rotulo">
          Data do evento (opcional)
          <input type="date" name="dataEvento" className="campo" />
        </label>
      </div>

      {estado.erro && (
        <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          {estado.erro}
        </p>
      )}

      <button disabled={enviando} className="btn-primario py-3 text-base">
        {enviando ? "Criando álbum..." : "Criar álbum"}
      </button>
    </form>
  );
}
