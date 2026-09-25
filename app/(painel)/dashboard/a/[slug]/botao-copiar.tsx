"use client";

import { useState } from "react";

export function BotaoCopiar({ texto, className = "btn-secundario" }: { texto: string; className?: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <button onClick={copiar} className={className}>
      {copiado ? "✓ Copiado!" : "Copiar link"}
    </button>
  );
}
