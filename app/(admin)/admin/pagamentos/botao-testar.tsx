"use client";

import { useState, useTransition } from "react";
import { testarMercadoPago } from "../actions";

export function BotaoTestarMercadoPago() {
  const [resultado, setResultado] = useState<string>();
  const [pendente, iniciar] = useTransition();

  function testar() {
    iniciar(async () => {
      const r = await testarMercadoPago();
      setResultado(r.ok ? `✓ Conectado à conta ${r.conta}` : `✗ ${r.erro}`);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button onClick={testar} disabled={pendente} className="btn-secundario">
        {pendente ? "Testando..." : "Testar conexão"}
      </button>
      {resultado && (
        <span className={`text-sm ${resultado.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>{resultado}</span>
      )}
    </div>
  );
}
