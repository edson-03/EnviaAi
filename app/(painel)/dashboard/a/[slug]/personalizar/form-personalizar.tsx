"use client";

import { useState, useTransition } from "react";
import { CORES_TEMA } from "@/lib/cores";
import { enviarCapa, removerCapa, salvarCor } from "../actions";

const LADO_MAXIMO = 1600; // px

// Reduz a foto no navegador (JPEG) para a capa sair leve e rápida para os convidados.
async function reduzirImagem(arquivo: File): Promise<Blob> {
  const bitmap = await createImageBitmap(arquivo);
  const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((ok, falha) =>
    canvas.toBlob((b) => (b ? ok(b) : falha(new Error("Não foi possível ler a imagem"))), "image/jpeg", 0.85),
  );
}

export function FormPersonalizar({
  slug,
  titulo,
  cor,
  capaUrl,
}: {
  slug: string;
  titulo: string;
  cor: string;
  capaUrl?: string;
}) {
  const [corAtual, setCorAtual] = useState(cor);
  const [erro, setErro] = useState<string>();
  const [pendente, iniciar] = useTransition();

  function escolherCor(hex: string) {
    setCorAtual(hex);
    iniciar(() => salvarCor(slug, hex));
  }

  function aoEscolherCapa(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    setErro(undefined);
    iniciar(async () => {
      try {
        const form = new FormData();
        form.set("capa", new File([await reduzirImagem(arquivo)], "capa.jpg", { type: "image/jpeg" }));
        const res = await enviarCapa(slug, form);
        if (res.erro) setErro(res.erro);
      } catch {
        setErro("Não foi possível usar esta imagem. Tente outra foto.");
      }
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_22rem] lg:items-start">
      <div className="flex flex-col gap-4">
        <section className="cartao p-6">
          <h2 className="text-lg font-semibold">Cor do evento</h2>
          <p className="mt-1 text-sm text-zinc-500">Usada nos botões e detalhes da página dos convidados e na placa.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {CORES_TEMA.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => escolherCor(c.hex)}
                title={c.nome}
                aria-label={c.nome}
                aria-pressed={corAtual === c.hex}
                className={`h-10 w-10 rounded-full ring-offset-2 ring-offset-white transition hover:scale-110 dark:ring-offset-zinc-900 ${
                  corAtual === c.hex ? "ring-2 ring-zinc-900 dark:ring-white" : ""
                }`}
                style={{ background: c.hex }}
              />
            ))}
          </div>
        </section>

        <section className="cartao p-6">
          <h2 className="text-lg font-semibold">Foto de capa</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Aparece no topo da página dos convidados. Fica guardada na pasta do álbum no seu Drive.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <label className={`btn-primario cursor-pointer ${pendente ? "pointer-events-none opacity-60" : ""}`}>
              {pendente ? "Salvando..." : capaUrl ? "Trocar foto" : "Escolher foto"}
              <input type="file" accept="image/*" onChange={aoEscolherCapa} className="hidden" />
            </label>
            {capaUrl && (
              <button
                type="button"
                disabled={pendente}
                onClick={() => iniciar(() => removerCapa(slug))}
                className="btn-secundario"
              >
                Remover capa
              </button>
            )}
          </div>
          {erro && <p className="mt-3 text-sm text-red-600">{erro}</p>}
        </section>
      </div>

      {/* Prévia do topo da página dos convidados */}
      <section className="cartao overflow-hidden">
        <p className="border-b border-zinc-100 px-4 py-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
          Prévia
        </p>
        <div className="bg-white p-4 text-center text-zinc-900">
          {capaUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- capa servida pela nossa rota
            <img src={capaUrl} alt="" className="h-32 w-full rounded-lg object-cover" />
          ) : (
            <div className="h-20 rounded-lg" style={{ background: `linear-gradient(135deg, ${corAtual}, ${corAtual}99)` }} />
          )}
          <p className="mt-3 text-lg font-bold">{titulo}</p>
          <div className="mt-3 rounded-lg py-2 text-xs font-semibold text-white" style={{ background: corAtual }}>
            Escolher fotos e vídeos
          </div>
        </div>
      </section>
    </div>
  );
}
