"use client";

import { useEffect, useRef, useState } from "react";
import { enviarArquivo } from "@/lib/resumable-upload";

const PARALELOS = 3;

type Item = {
  nome: string;
  total: number;
  enviado: number;
  status: "aguardando" | "enviando" | "ok" | "erro";
  erro?: string;
};

export function EnvioConvidado({ slug }: { slug: string }) {
  const [nomeConvidado, setNomeConvidado] = useState("");
  const [itens, setItens] = useState<Item[]>([]);
  const arquivos = useRef<File[]>([]);
  const fila = useRef<number[]>([]);
  const ativos = useRef(0);

  const emAndamento = itens.some((it) => it.status === "aguardando" || it.status === "enviando");
  const concluidos = itens.filter((it) => it.status === "ok").length;
  const comErro = itens.filter((it) => it.status === "erro").length;

  // Enquanto envia: tela acesa (Wake Lock) e confirmação antes de sair da página.
  useEffect(() => {
    if (!emAndamento) return;
    let lock: WakeLockSentinel | undefined;
    const pedirLock = () => {
      if (document.visibilityState === "visible") {
        navigator.wakeLock?.request("screen").then((l) => (lock = l)).catch(() => {});
      }
    };
    const avisarSaida = (e: BeforeUnloadEvent) => e.preventDefault();
    pedirLock();
    document.addEventListener("visibilitychange", pedirLock);
    window.addEventListener("beforeunload", avisarSaida);
    return () => {
      lock?.release().catch(() => {});
      document.removeEventListener("visibilitychange", pedirLock);
      window.removeEventListener("beforeunload", avisarSaida);
    };
  }, [emAndamento]);

  function atualizar(i: number, parcial: Partial<Item>) {
    setItens((atual) => atual.map((it, idx) => (idx === i ? { ...it, ...parcial } : it)));
  }

  async function enviar(i: number) {
    const file = arquivos.current[i];
    atualizar(i, { status: "enviando", enviado: 0, erro: undefined });
    try {
      const res = await fetch("/api/upload-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
          nomeConvidado: nomeConvidado.trim() || undefined,
        }),
      });
      const dados = await res.json();
      if (!res.ok) throw new Error(dados.erro ?? `Erro ${res.status}`);

      const driveFile = await enviarArquivo(file, dados.uploadUrl, (bytes) => atualizar(i, { enviado: bytes }));
      atualizar(i, { status: "ok" });

      // O arquivo já está no Drive; falha no registro não é erro para o convidado.
      fetch("/api/upload-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, fileId: driveFile.id, nomeConvidado: nomeConvidado.trim() || undefined }),
      }).catch(() => {});
    } catch (e) {
      atualizar(i, { status: "erro", erro: (e as Error).message });
    }
  }

  function processarFila() {
    while (ativos.current < PARALELOS && fila.current.length) {
      const i = fila.current.shift()!;
      ativos.current++;
      enviar(i).finally(() => {
        ativos.current--;
        processarFila();
      });
    }
  }

  function aoSelecionar(e: React.ChangeEvent<HTMLInputElement>) {
    const novos = Array.from(e.target.files ?? []);
    e.target.value = "";
    const base = arquivos.current.length;
    arquivos.current.push(...novos);
    setItens((atual) => [
      ...atual,
      ...novos.map((f) => ({ nome: f.name, total: f.size, enviado: 0, status: "aguardando" as const })),
    ]);
    fila.current.push(...novos.map((_, k) => base + k));
    processarFila();
  }

  function tentarDeNovo() {
    itens.forEach((it, i) => {
      if (it.status === "erro") {
        atualizar(i, { status: "aguardando", erro: undefined });
        fila.current.push(i);
      }
    });
    processarFila();
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Seu nome (opcional)
        <input
          value={nomeConvidado}
          onChange={(e) => setNomeConvidado(e.target.value)}
          maxLength={80}
          className="rounded-lg border px-3 py-2 font-normal"
        />
      </label>

      <label className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-3 text-center font-medium text-white hover:bg-zinc-700">
        Escolher fotos e vídeos
        <input type="file" multiple accept="image/*,video/*" onChange={aoSelecionar} className="hidden" />
      </label>

      {emAndamento && (
        <p className="rounded-lg border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900">
          Enviando... Mantenha esta tela aberta até terminar.
        </p>
      )}
      {!emAndamento && concluidos > 0 && comErro === 0 && (
        <p className="rounded-lg border border-green-500 bg-green-50 p-3 text-sm text-green-900">
          Pronto! {concluidos} {concluidos === 1 ? "arquivo enviado" : "arquivos enviados"}. Obrigado!
        </p>
      )}
      {!emAndamento && comErro > 0 && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-red-400 bg-red-50 p-3 text-sm text-red-900">
          {comErro} {comErro === 1 ? "arquivo não foi enviado" : "arquivos não foram enviados"}.
          <button onClick={tentarDeNovo} className="font-medium underline">
            Tentar de novo
          </button>
        </div>
      )}

      <ul className="space-y-3">
        {itens.map((it, i) => {
          const pct = it.total ? Math.round((it.enviado / it.total) * 100) : 0;
          return (
            <li key={i} className="text-sm">
              <div className="flex justify-between gap-2">
                <span className="truncate">{it.nome}</span>
                <span className="shrink-0">
                  {it.status === "ok" ? "Enviado" : it.status === "erro" ? "Erro" : it.status === "aguardando" ? "Na fila" : `${pct}%`}
                </span>
              </div>
              <div className="mt-1 h-2 rounded bg-zinc-200">
                <div
                  className={`h-2 rounded ${it.status === "erro" ? "bg-red-500" : it.status === "ok" ? "bg-green-500" : "bg-zinc-900"}`}
                  style={{ width: `${it.status === "ok" ? 100 : pct}%` }}
                />
              </div>
              {it.erro && <p className="mt-1 text-xs text-red-600">{it.erro}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
