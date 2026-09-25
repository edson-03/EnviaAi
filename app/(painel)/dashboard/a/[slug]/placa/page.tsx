import Link from "next/link";
import QRCode from "qrcode";
import { corDoAlbum } from "@/lib/cores";
import { albumDoDono, linkDoAlbum } from "../dados";
import { BotaoImprimir } from "./botao-imprimir";
import { Placa } from "./placa";

export default async function PlacaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ modelo?: string }>;
}) {
  const [{ slug }, { modelo }] = await Promise.all([params, searchParams]);
  const { album } = await albumDoDono(slug);
  const mesa = modelo === "mesa";
  const link = linkDoAlbum(slug);
  const cor = corDoAlbum(album.corTema);
  const qr = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    await QRCode.toString(link, { type: "svg", margin: 1, color: { dark: "#18181b", light: "#ffffff" } }),
  )}`;

  return (
    <div>
      <style>{"@page { size: A4; margin: 0 }"}</style>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
          {[
            { id: "cartaz", rotulo: "Cartaz A4" },
            { id: "mesa", rotulo: "Cartões de mesa" },
          ].map((m) => (
            <Link
              key={m.id}
              href={`/dashboard/a/${slug}/placa?modelo=${m.id}`}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                (m.id === "mesa") === mesa ? "bg-white shadow-sm dark:bg-zinc-900" : "text-zinc-500"
              }`}
            >
              {m.rotulo}
            </Link>
          ))}
        </div>
        <BotaoImprimir />
      </div>
      <p className="mb-4 text-sm text-zinc-500 print:hidden">
        Na janela de impressão, escolha “Salvar como PDF” para guardar o arquivo. Use papel A4, sem margens e com “Gráficos
        de fundo” ligado.
      </p>

      {/* Folha A4 (210 × 297 mm). Na tela aparece com sombra; na impressão ocupa a página inteira. */}
      <div className="mx-auto overflow-x-auto print:overflow-visible">
        <div
          className="mx-auto overflow-hidden bg-white shadow-xl print:shadow-none"
          style={{ width: "210mm", height: "296mm", printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
        >
          {mesa ? (
            <div className="grid h-full w-full grid-cols-2 grid-rows-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="border border-dashed border-zinc-300">
                  <Placa titulo={album.titulo} qr={qr} link={link} cor={cor} escala={0.5} />
                </div>
              ))}
            </div>
          ) : (
            <Placa titulo={album.titulo} qr={qr} link={link} cor={cor} escala={1} />
          )}
        </div>
      </div>
    </div>
  );
}
