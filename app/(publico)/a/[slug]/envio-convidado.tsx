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
  const [recado, setRecado] = useState("");
  const [recadoEnviado, setRecadoEnviado] = useState(false);
  const [itens, setItens] = useState<Item[]>([]);
  const arquivos = useRef<File[]>([]);
  const recadoPorArquivo = useRef(new Map<number, string>()); // recado vai só no 1º arquivo da seleção
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
    const recadoArquivo = recadoPorArquivo.current.get(i);
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
          recado: recadoArquivo,
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
        body: JSON.stringify({
          slug,
          fileId: driveFile.id,
          nomeConvidado: nomeConvidado.trim() || undefined,
          recado: recadoArquivo,
        }),
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
    if (novos.length && recado.trim()) {
      recadoPorArquivo.current.set(base, recado.trim());
      setRecado("");
      setRecadoEnviado(true);
    }
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
    <div className="mt-8 flex flex-col gap-4">
      <div className="cartao flex flex-col gap-5 p-5">
        <label className="rotulo">
          Seu nome (opcional)
          <input
            value={nomeConvidado}
            onChange={(e) => setNomeConvidado(e.target.value)}
            maxLength={80}
            placeholder="Assim sabem quem enviou"
            className="campo"
          />
        </label>

        <label className="rotulo">
          Deixe um recado (opcional)
          <textarea
            value={recado}
            onChange={(e) => {
              setRecado(e.target.value);
              setRecadoEnviado(false);
            }}
            maxLength={500}
            rows={2}
            placeholder="Uma mensagem para quem organizou o evento"
            className="campo resize-y"
          />
          <span className="text-xs font-normal text-zinc-500">
            {recadoEnviado ? "✓ Recado adicionado às fotos escolhidas." : "Vai junto com as próximas fotos que você escolher."}
          </span>
        </label>

        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[color-mix(in_srgb,var(--cor)_40%,transparent)] bg-[color-mix(in_srgb,var(--cor)_7%,transparent)] px-4 py-8 text-center transition hover:border-[var(--cor)] hover:bg-[color-mix(in_srgb,var(--cor)_12%,transparent)]">
          <svg viewBox="0 0 24 24" className="h-10 w-10 text-[var(--cor)]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M12 16V4m0 0-4 4m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" />
          </svg>
          <span className="font-semibold text-[var(--cor)]">
            {itens.length ? "Enviar mais fotos e vídeos" : "Escolher fotos e vídeos"}
          </span>
          <span className="text-xs text-zinc-500">Você pode selecionar vários de uma vez</span>
          <input type="file" multiple accept="image/*,video/*" onChange={aoSelecionar} className="hidden" />
        </label>
      </div>

      {emAndamento && (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <strong>
            Enviando {concluidos} de {itens.length}...
          </strong>{" "}
          Mantenha esta tela aberta até terminar.
        </p>
      )}
      {!emAndamento && concluidos > 0 && comErro === 0 && (
        <p className="rounded-xl border border-green-300 bg-green-50 p-4 text-sm text-green-900 dark:border-green-800 dark:bg-green-950/40 dark:text-green-200">
          <strong>Pronto!</strong> {concluidos} {concluidos === 1 ? "arquivo enviado" : "arquivos enviados"}. Obrigado por
          compartilhar!
        </p>
      )}
      {!emAndamento && comErro > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          {comErro} {comErro === 1 ? "arquivo não foi enviado" : "arquivos não foram enviados"}.
          <button onClick={tentarDeNovo} className="btn-secundario shrink-0">
            Tentar de novo
          </button>
        </div>
      )}

      {itens.length > 0 && (
        <ul className="cartao divide-y divide-zinc-100 dark:divide-zinc-800">
          {itens.map((it, i) => {
            const pct = it.status === "ok" ? 100 : it.total ? Math.round((it.enviado / it.total) * 100) : 0;
            return (
              <li key={i} className="px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate">{it.nome}</span>
                  <span
                    className={`shrink-0 text-xs font-medium ${
                      it.status === "ok"
                        ? "text-green-600"
                        : it.status === "erro"
                          ? "text-red-600"
                          : "text-zinc-500"
                    }`}
                  >
                    {it.status === "ok" ? "✓ Enviado" : it.status === "erro" ? "Erro" : it.status === "aguardando" ? "Na fila" : `${pct}%`}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className={`h-full rounded-full transition-all ${
                      it.status === "erro" ? "bg-red-500" : it.status === "ok" ? "bg-green-500" : "bg-[var(--cor)]"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {it.erro && <p className="mt-1 text-xs text-red-600">{it.erro}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
