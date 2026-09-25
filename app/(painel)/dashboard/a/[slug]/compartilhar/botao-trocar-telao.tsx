"use client";

import { useTransition } from "react";
import { gerarLinkTelao } from "../actions";

export function BotaoTrocarTelao({ slug }: { slug: string }) {
  const [pendente, iniciar] = useTransition();

  function trocar() {
    if (confirm("Gerar um novo link do telão? O link atual para de funcionar, inclusive em telas que estiverem abertas.")) {
      iniciar(() => gerarLinkTelao(slug));
    }
  }

  return (
    <button onClick={trocar} disabled={pendente} className="btn-secundario">
      {pendente ? "Gerando..." : "Trocar link"}
    </button>
  );
}
