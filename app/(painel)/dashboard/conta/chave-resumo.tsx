"use client";

import { useOptimistic, useTransition } from "react";
import { definirResumoEmail } from "./actions";

export function ChaveResumo({ ativo }: { ativo: boolean }) {
  const [valor, setValor] = useOptimistic(ativo);
  const [, iniciar] = useTransition();

  function alternar() {
    iniciar(async () => {
      setValor(!valor);
      await definirResumoEmail(!valor);
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={valor}
      onClick={alternar}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${valor ? "bg-violet-600" : "bg-zinc-300 dark:bg-zinc-700"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${valor ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}
