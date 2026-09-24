"use client";

// Etapa 0: página de teste do upload direto para o Drive.
import { useState } from "react";
import { enviarArquivo } from "@/lib/resumable-upload";

type Item = {
  nome: string;
  total: number;
  enviado: number;
  status: "enviando" | "ok" | "erro";
  detalhe?: string;
};

export default function PocPage() {
  const [itens, setItens] = useState<Item[]>([]);

  function atualizar(i: number, parcial: Partial<Item>) {
    setItens((atual) => atual.map((it, idx) => (idx === i ? { ...it, ...parcial } : it)));
  }

  async function enviar(file: File, i: number) {
    const inicio = performance.now();
    try {
      const res = await fetch("/api/poc/upload-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, mimeType: file.type, size: file.size }),
      });
      const dados = await res.json();
      if (!res.ok) throw new Error(dados.erro ?? `Erro ${res.status}`);

      const driveFile = await enviarArquivo(file, dados.uploadUrl, (bytes) =>
        atualizar(i, { enviado: bytes }),
      );
      const segundos = ((performance.now() - inicio) / 1000).toFixed(1);
      atualizar(i, { status: "ok", detalhe: `${driveFile.id} em ${segundos}s` });
    } catch (e) {
      atualizar(i, { status: "erro", detalhe: (e as Error).message });
    }
  }

  function aoSelecionar(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files ?? []);
    const base = itens.length;
    setItens((atual) => [
      ...atual,
      ...arquivos.map((f) => ({ nome: f.name, total: f.size, enviado: 0, status: "enviando" as const })),
    ]);
    arquivos.forEach((f, k) => enviar(f, base + k));
    e.target.value = "";
  }

  return (
    <main className="mx-auto w-full max-w-lg p-4">
      <h1 className="mb-4 text-2xl font-bold">Teste de upload (Etapa 0)</h1>
      <input
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={aoSelecionar}
        className="mb-6 block w-full"
      />
      <ul className="space-y-3">
        {itens.map((it, i) => {
          const pct = it.total ? Math.round((it.enviado / it.total) * 100) : 0;
          return (
            <li key={i} className="text-sm">
              <div className="flex justify-between gap-2">
                <span className="truncate">{it.nome}</span>
                <span>{it.status === "enviando" ? `${pct}%` : it.status}</span>
              </div>
              <div className="mt-1 h-2 rounded bg-zinc-200">
                <div
                  className={`h-2 rounded ${it.status === "erro" ? "bg-red-500" : "bg-violet-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {it.detalhe && <p className="mt-1 break-all text-xs text-zinc-500">{it.detalhe}</p>}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
