"use client";

export function BotaoImprimir() {
  return (
    <button onClick={() => window.print()} className="btn-primario">
      Imprimir / Salvar PDF
    </button>
  );
}
