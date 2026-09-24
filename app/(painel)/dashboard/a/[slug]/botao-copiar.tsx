"use client";

import { useState } from "react";

export function BotaoCopiar({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <button onClick={copiar} className="btn-secundario">
      {copiado ? "✓ Copiado!" : "Copiar link"}
    </button>
  );
}
