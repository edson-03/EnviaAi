import Link from "next/link";
import QRCode from "qrcode";
import { BotaoCopiar } from "../botao-copiar";
import { albumDoDono, linkDoAlbum } from "../dados";

const MODELOS = [
  { id: "cartaz", titulo: "Cartaz A4", texto: "Uma folha A4 com QR grande. Para a entrada, o bolo ou a pista." },
  { id: "mesa", titulo: "Cartões de mesa", texto: "4 cartões por folha A4, com linhas de corte. Um por mesa." },
];

export default async function CompartilharPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { album } = await albumDoDono(slug);
  const link = linkDoAlbum(slug);

  const [qrSvg, qrPng] = await Promise.all([
    QRCode.toString(link, { type: "svg", margin: 2 }),
    QRCode.toDataURL(link, { width: 1024, margin: 2 }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <section className="cartao flex flex-col items-center gap-6 p-5 sm:flex-row">
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL gerada no servidor */}
        <img
          src={qrPng}
          alt={`QR code do álbum ${album.titulo}`}
          className="h-44 w-44 shrink-0 rounded-lg border border-zinc-200 bg-white p-1"
        />
        <div className="flex min-w-0 flex-col gap-3 text-center sm:text-left">
          <div>
            <h2 className="font-semibold">Link e QR code</h2>
            <p className="mt-1 text-sm text-zinc-500">Quem abrir o link ou escanear o QR já pode enviar fotos, sem cadastro.</p>
          </div>
          <p className="break-all rounded-lg bg-zinc-100 px-3 py-2 font-mono text-xs dark:bg-zinc-800">{link}</p>
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            <BotaoCopiar texto={link} />
            <a href={qrPng} download={`qrcode-${slug}.png`} className="btn-secundario">
              Baixar PNG
            </a>
            <a
              href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg)}`}
              download={`qrcode-${slug}.svg`}
              className="btn-secundario"
            >
              Baixar SVG
            </a>
            <a href={link} target="_blank" rel="noreferrer" className="btn-secundario">
              Abrir página ↗
            </a>
          </div>
        </div>
      </section>

      <section className="mt-4">
        <h2 className="text-lg font-semibold">Placa para imprimir</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Pronta com o nome do evento, o QR code e as instruções. Imprima ou salve em PDF.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {MODELOS.map((m) => (
            <Link
              key={m.id}
              href={`/dashboard/a/${slug}/placa?modelo=${m.id}`}
              className="cartao group flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg dark:hover:border-violet-800"
            >
              <span className="font-semibold group-hover:text-violet-600">{m.titulo}</span>
              <span className="mt-1 text-sm text-zinc-500">{m.texto}</span>
              <span className="mt-4 text-sm font-medium text-violet-600">Ver e imprimir →</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
