"use client";

import { useActionState, useState } from "react";
import { excluirConta } from "./actions";

export function FormExcluir() {
  const [estado, acao, enviando] = useActionState(excluirConta, {});
  const [texto, setTexto] = useState("");

  return (
    <form action={acao} className="mt-5 flex flex-col gap-4">
      <label className="rotulo">
        Para confirmar, digite EXCLUIR
        <input
          name="confirmacao"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          autoComplete="off"
          className="campo"
        />
      </label>

      {estado.erro && <p className="text-sm text-red-600">{estado.erro}</p>}

      <button
        disabled={enviando || texto.trim() !== "EXCLUIR"}
        className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-3 font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
      >
        {enviando ? "Excluindo..." : "Excluir minha conta"}
      </button>
    </form>
  );
}
