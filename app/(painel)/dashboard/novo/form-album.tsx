"use client";

import { useActionState } from "react";
import { criarAlbum } from "./actions";
import { TIPOS_EVENTO } from "./tipos-evento";

export function FormAlbum() {
  const [estado, acao, enviando] = useActionState(criarAlbum, {});

  return (
    <form action={acao} className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Nome do evento
        <input
          name="titulo"
          required
          maxLength={120}
          placeholder="Casamento Ana e Léo"
          className="rounded-lg border px-3 py-2 font-normal"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Tipo de evento (opcional)
        <select name="tipoEvento" defaultValue="" className="rounded-lg border px-3 py-2 font-normal">
          <option value="">Selecione</option>
          {TIPOS_EVENTO.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Data do evento (opcional)
        <input type="date" name="dataEvento" className="rounded-lg border px-3 py-2 font-normal" />
      </label>

      {estado.erro && <p className="text-sm text-red-600">{estado.erro}</p>}

      <button
        disabled={enviando}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
      >
        {enviando ? "Criando..." : "Criar álbum"}
      </button>
    </form>
  );
}
