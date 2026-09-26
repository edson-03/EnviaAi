import Link from "next/link";
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
  const { album, situacao } = await albumDoDono(slug);

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
              {situacao.pago ? (
                <span className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-2.5 py-1 text-xs font-semibold tracking-normal text-white">
                  {situacao.plano.nome}
                </span>
              ) : (
                <span className="rounded-full bg-zinc-200 px-2.5 py-1 text-xs font-medium tracking-normal text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {situacao.plano.nome}
                </span>
              )}
            </h1>
            {situacao.prazoFinal && (
              <p className={`mt-1 text-xs ${situacao.prazoEncerrado ? "font-medium text-red-600" : "text-zinc-500"}`}>
                {situacao.prazoEncerrado ? "Prazo para receber arquivos encerrado em " : "Recebe arquivos até "}
                {situacao.prazoFinal.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
              </p>
            )}
            {situacao.planoVencido && (
              <p className="mt-1 text-xs font-medium text-amber-600">
                O plano {situacao.planoVencido} venceu; o álbum voltou às regras do plano grátis.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {!situacao.pago && (
              <Link href={`/dashboard/a/${slug}/premium`} className="btn-primario">
                {situacao.planoVencido ? "Renovar plano" : "Ver planos"}
              </Link>
            )}
            <a
              href={`https://drive.google.com/drive/folders/${album.driveFolderId}`}
              target="_blank"
              rel="noreferrer"
              className="btn-secundario"
            >
              Pasta no Drive ↗
            </a>
          </div>
        </div>
        {album.suspenso && (
          <p className="mt-4 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
            <strong>Álbum suspenso pelo suporte.</strong> Os convidados não conseguem abrir nem enviar arquivos. Os
            arquivos já recebidos continuam no seu Drive. Dúvidas: edsonsilvat03@gmail.com.
          </p>
        )}
        <AbasAlbum slug={slug} />
      </div>
      <div className="mt-6 print:mt-0">{children}</div>
    </main>
  );
}
