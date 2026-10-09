"use client";

import { useEffect, useRef, useState } from "react";
import { enviarArquivo } from "@/lib/resumable-upload";

const MAX_SEGUNDOS = 60;

// Formato que o navegador sabe gravar (Chrome/Android: webm; Safari/iPhone: mp4).
function formatoDeGravacao() {
  for (const tipo of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(tipo)) return tipo;
  }
  return "";
}

type Estado = "parado" | "gravando" | "gravado" | "enviando" | "enviado";

export function LivroDeVisitas({ slug, previa = false }: { slug: string; previa?: boolean }) {
  const [aba, setAba] = useState<"texto" | "audio">("texto");
  const [nome, setNome] = useState("");
  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState<Estado>("parado");
  const [segundos, setSegundos] = useState(0);
  const [audio, setAudio] = useState<{ blob: Blob; url: string } | null>(null);
  const [erro, setErro] = useState<string>();
  const gravador = useRef<MediaRecorder | null>(null);
  const relogio = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (relogio.current) clearInterval(relogio.current);
      gravador.current?.stream.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  async function gravar() {
    setErro(undefined);
    const formato = formatoDeGravacao();
    if (!formato || !navigator.mediaDevices) {
      setErro("Este navegador não permite gravar áudio. Deixe uma mensagem escrita.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const partes: Blob[] = [];
      const rec = new MediaRecorder(stream, { mimeType: formato });
      rec.ondataavailable = (e) => e.data.size && partes.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (relogio.current) clearInterval(relogio.current);
        const blob = new Blob(partes, { type: formato.split(";")[0] });
        setAudio({ blob, url: URL.createObjectURL(blob) });
        setEstado("gravado");
      };
      gravador.current = rec;
      rec.start();
      setSegundos(0);
      setEstado("gravando");
      relogio.current = setInterval(() => {
        setSegundos((s) => {
          if (s + 1 >= MAX_SEGUNDOS && rec.state === "recording") rec.stop();
          return s + 1;
        });
      }, 1000);
    } catch {
      setErro("Não conseguimos usar o microfone. Verifique a permissão do navegador.");
    }
  }

  function descartar() {
    if (audio) URL.revokeObjectURL(audio.url);
    setAudio(null);
    setEstado("parado");
    setSegundos(0);
  }

  async function enviar() {
    setErro(undefined);
    setEstado("enviando");
    try {
      let audioFileId: string | undefined;
      if (aba === "audio" && audio) {
        const res = await fetch("/api/mensagens/audio-sessao", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, mimeType: audio.blob.type, size: audio.blob.size, nome: nome.trim() || undefined }),
        });
        const dados = await res.json();
        if (!res.ok) throw new Error(dados.erro ?? "Não foi possível enviar o áudio");
        const arquivo = new File([audio.blob], "mensagem", { type: audio.blob.type });
        audioFileId = (await enviarArquivo(arquivo, dados.uploadUrl, () => {})).id;
      }
      const res = await fetch("/api/mensagens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          nome: nome.trim() || undefined,
          texto: aba === "texto" ? texto.trim() : undefined,
          audioFileId,
          duracaoSeg: audioFileId ? segundos : undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).erro ?? "Não foi possível enviar a mensagem");
      setEstado("enviado");
      setTexto("");
      if (audio) URL.revokeObjectURL(audio.url);
      setAudio(null);
    } catch (e) {
      setErro((e as Error).message);
      setEstado(aba === "audio" && audio ? "gravado" : "parado");
    }
  }

  const podeEnviar = aba === "texto" ? texto.trim().length > 0 : estado === "gravado";

  return (
    <section className="cartao mt-6 p-5">
      <h2 className="font-semibold">Livro de visitas</h2>
      <p className="mt-1 text-sm text-zinc-500">Deixe uma mensagem para quem organizou o evento.</p>

      {estado === "enviado" ? (
        <div className="mt-4 rounded-xl border border-green-300 bg-green-50 p-4 text-sm text-green-900 dark:border-green-800 dark:bg-green-950/40 dark:text-green-200">
          <strong>Mensagem enviada!</strong> Obrigado pelo carinho.{" "}
          <button onClick={() => setEstado("parado")} className="font-medium underline">
            Enviar outra
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
            {(["texto", "audio"] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAba(a)}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium ${
                  aba === a ? "bg-white shadow-sm dark:bg-zinc-900" : "text-zinc-500"
                }`}
              >
                {a === "texto" ? "Escrever" : "Gravar áudio"}
              </button>
            ))}
          </div>

          <label className="rotulo">
            Seu nome (opcional)
            <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} className="campo" />
          </label>

          {aba === "texto" ? (
            <label className="rotulo">
              Mensagem
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                maxLength={1000}
                rows={4}
                placeholder="Escreva algo especial..."
                className="campo resize-y"
              />
            </label>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[color-mix(in_srgb,var(--cor)_40%,transparent)] p-5 text-center">
              {estado === "gravando" ? (
                <>
                  <p className="flex items-center gap-2 font-semibold text-red-600">
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" />
                    Gravando… {segundos}s / {MAX_SEGUNDOS}s
                  </p>
                  <button type="button" onClick={() => gravador.current?.stop()} className="btn-secundario">
                    Parar
                  </button>
                </>
              ) : audio ? (
                <>
                  <audio src={audio.url} controls className="w-full" />
                  <button type="button" onClick={descartar} className="text-sm text-zinc-500 underline">
                    Gravar de novo
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-zinc-500">Até {MAX_SEGUNDOS} segundos. Você ouve antes de enviar.</p>
                  <button type="button" onClick={gravar} className="btn-primario bg-[var(--cor)] hover:opacity-90">
                    ● Começar a gravar
                  </button>
                </>
              )}
            </div>
          )}

          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <button
            type="button"
            onClick={enviar}
            disabled={previa || !podeEnviar || estado === "enviando"}
            className="btn-primario bg-[var(--cor)] py-2.5 hover:opacity-90"
          >
            {previa ? "Envio desativado na prévia" : estado === "enviando" ? "Enviando..." : "Enviar mensagem"}
          </button>
        </div>
      )}
    </section>
  );
}
