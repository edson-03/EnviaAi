import { BotaoVoltar } from "@/components/botao-voltar";
import { EtiquetaPausado } from "../../etiqueta-pausado";
import { AbasAlbum } from "./abas-album";
import { albumDoDono } from "./dados";

export default async function AlbumLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { album } = await albumDoDono(slug);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 print:max-w-none print:p-0">
      <div className="print:hidden">
        <BotaoVoltar href="/dashboard">Seus álbuns</BotaoVoltar>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            {album.tipoEvento && <p className="text-sm font-medium text-violet-600">{album.tipoEvento}</p>}
            <h1 className="flex flex-wrap items-center gap-3 text-3xl font-bold tracking-tight">
              <span className="truncate">{album.titulo}</span>
              {!album.ativo && <EtiquetaPausado />}
            </h1>
          </div>
          <a
            href={`https://drive.google.com/drive/folders/${album.driveFolderId}`}
            target="_blank"
            rel="noreferrer"
            className="btn-secundario"
          >
            Pasta no Drive ↗
          </a>
        </div>
        <AbasAlbum slug={slug} />
      </div>
      <div className="mt-6 print:mt-0">{children}</div>
    </main>
  );
}
