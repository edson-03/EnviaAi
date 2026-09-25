"use client";

import { useEffect, useRef, useState } from "react";

type Foto = { id: string; nome: string | null; recado: string | null };

const TROCA_MS = 6000; // tempo de cada foto
const BUSCA_MS = 10000; // busca de fotos novas

export function Slideshow({ token, titulo, cor, qr }: { token: string; titulo: string; cor: string; qr: string }) {
  const [atual, setAtual] = useState<Foto | null>(null);
  const [telaCheia, setTelaCheia] = useState(false);
  const todas = useRef<Foto[]>([]); // rodízio de fotos já exibidas
  const novas = useRef<Foto[]>([]); // chegaram agora: passam na frente
  const conhecidas = useRef(new Set<string>());
  const indice = useRef(0);

  const urlFoto = (id: string) => `/api/telao/${token}/foto/${encodeURIComponent(id)}`;

  // Busca a lista periodicamente; o que ainda não foi visto entra na fila de novas.
  useEffect(() => {
    let ativo = true;
    async function buscar() {
      try {
        const res = await fetch(`/api/telao/${token}/fotos`, { cache: "no-store" });
        if (!res.ok) return;
        const { fotos } = (await res.json()) as { fotos: Foto[] };
        const visiveis = new Set(fotos.map((f) => f.id));
        // Foto ocultada no painel sai do rodízio.
        todas.current = todas.current.filter((f) => visiveis.has(f.id));
        novas.current = novas.current.filter((f) => visiveis.has(f.id));
        for (const f of fotos) {
          if (!conhecidas.current.has(f.id)) {
            conhecidas.current.add(f.id);
            novas.current.push(f);
          }
        }
      } catch {
        // sem internet: tenta na próxima
      }
    }
    buscar();
    const t = setInterval(() => ativo && buscar(), BUSCA_MS);
    return () => {
      ativo = false;
      clearInterval(t);
    };
  }, [token]);

  // Troca de foto: carrega a próxima antes de mostrar, para não piscar.
  useEffect(() => {
    let cancelado = false;
    function proxima(): Foto | null {
      const nova = novas.current.shift();
      if (nova) {
        todas.current.push(nova);
        return nova;
      }
      if (!todas.current.length) return null;
      indice.current = (indice.current + 1) % todas.current.length;
      return todas.current[indice.current];
    }
    function avancar() {
      const foto = proxima();
      if (!foto) return;
      const img = new Image();
      img.onload = () => !cancelado && setAtual(foto);
      // Miniatura ainda não gerada pelo Drive: tira do rodízio e deixa a próxima busca trazer de volta.
      img.onerror = () => {
        todas.current = todas.current.filter((f) => f.id !== foto.id);
        conhecidas.current.delete(foto.id);
      };
      img.src = urlFoto(foto.id);
    }
    avancar();
    const t = setInterval(avancar, TROCA_MS);
    return () => {
      cancelado = true;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- urlFoto só depende de token
  }, [token]);

  // Tela sempre acesa enquanto o telão estiver aberto.
  useEffect(() => {
    let lock: WakeLockSentinel | undefined;
    const pedir = () => {
      if (document.visibilityState === "visible") navigator.wakeLock?.request("screen").then((l) => (lock = l)).catch(() => {});
    };
    const aoMudarTelaCheia = () => setTelaCheia(!!document.fullscreenElement);
    pedir();
    document.addEventListener("visibilitychange", pedir);
    document.addEventListener("fullscreenchange", aoMudarTelaCheia);
    return () => {
      lock?.release().catch(() => {});
      document.removeEventListener("visibilitychange", pedir);
      document.removeEventListener("fullscreenchange", aoMudarTelaCheia);
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-black text-white" style={{ ["--cor" as string]: cor }}>
      {atual ? (
        <>
          {/* Fundo desfocado preenche as bordas de fotos em pé */}
          {/* eslint-disable-next-line @next/next/no-img-element -- miniatura servida pela nossa rota */}
          <img key={`fundo-${atual.id}`} src={urlFoto(atual.id)} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl" />
          {/* eslint-disable-next-line @next/next/no-img-element -- miniatura servida pela nossa rota */}
          <img
            key={atual.id}
            src={urlFoto(atual.id)}
            alt={atual.nome ? `Foto enviada por ${atual.nome}` : "Foto do evento"}
            className="absolute inset-0 h-full w-full animate-[aparecer_0.8s_ease-out] object-contain"
          />
          {(atual.nome || atual.recado) && (
            <div className="absolute bottom-8 left-8 max-w-[60%] rounded-2xl bg-black/55 px-6 py-4 backdrop-blur">
              {atual.recado && <p className="text-2xl font-medium leading-snug">“{atual.recado}”</p>}
              {atual.nome && (
                <p className={`${atual.recado ? "mt-2 text-lg" : "text-2xl"} font-semibold text-[color-mix(in_srgb,var(--cor)_45%,white)]`}>
                  {atual.nome}
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
          <h1 className="text-5xl font-bold">{titulo}</h1>
          <p className="text-2xl text-zinc-300">Aguardando as primeiras fotos...</p>
          {/* eslint-disable-next-line @next/next/no-img-element -- QR gerado no servidor */}
          <img src={qr} alt="QR code para enviar fotos" className="h-72 w-72 rounded-2xl bg-white p-3" />
          <p className="text-xl text-zinc-300">Aponte a câmera e envie as suas</p>
        </div>
      )}

      {/* Canto: convite para enviar */}
      {atual && (
        <div className="absolute bottom-8 right-8 flex items-center gap-4 rounded-2xl bg-white p-3 pr-5 text-zinc-900 shadow-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element -- QR gerado no servidor */}
          <img src={qr} alt="QR code para enviar fotos" className="h-28 w-28" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: cor }}>
              Envie suas fotos
            </p>
            <p className="max-w-48 text-lg font-bold leading-tight">{titulo}</p>
          </div>
        </div>
      )}

      {!telaCheia && (
        <button
          onClick={() => document.documentElement.requestFullscreen().catch(() => {})}
          className="absolute right-4 top-4 rounded-lg bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur hover:bg-white/25"
        >
          Tela cheia
        </button>
      )}
    </div>
  );
}
