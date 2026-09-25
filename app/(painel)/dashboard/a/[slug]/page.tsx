import Link from "next/link";
import { ObjectId } from "mongodb";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { BotaoVoltar } from "@/components/botao-voltar";
import { auth } from "@/lib/auth";
import { statusDrive } from "@/lib/google";
import { albums, uploads } from "@/lib/mongodb";
import { EtiquetaPausado } from "../../etiqueta-pausado";
import { AcoesAlbum } from "./acoes-album";
import { BotaoCopiar } from "./botao-copiar";

const LIMITE_LISTA = 200;

type Estatisticas = {
  geral: { total: number; videos: number; bytes: number; nomes: (string | null)[]; anonimos: number }[];
  pico: { _id: number; n: number }[];
};

function Quadro({ rotulo, valor, detalhe }: { rotulo: string; valor: React.ReactNode; detalhe?: string }) {
  return (
    <div className="cartao p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{rotulo}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{valor}</p>
      {detalhe && <p className="mt-1 text-xs text-zinc-500">{detalhe}</p>}
    </div>
  );
}

function formatarBytes(bytes: number) {
  const unidades = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  while (bytes >= 1024 && i < unidades.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${unidades[i]}`;
}

export default async function AlbumPainelPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/entrar");

  const { slug } = await params;
  const album = await albums.findOne({ slug, ownerId: new ObjectId(session.user.id) });
  if (!album) notFound();

  const [drive, [stats], lista, recados] = await Promise.all([
    statusDrive(session.user.id),
    uploads
      .aggregate<Estatisticas>([
        { $match: { albumId: album._id } },
        {
          $facet: {
            geral: [
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  videos: { $sum: { $cond: [{ $regexMatch: { input: "$mimeType", regex: /^video\// } }, 1, 0] } },
                  bytes: { $sum: "$tamanhoBytes" },
                  nomes: { $addToSet: { $toLower: { $trim: { input: "$nomeConvidado" } } } },
                  anonimos: { $sum: { $cond: [{ $gt: ["$nomeConvidado", null] }, 0, 1] } },
                },
              },
            ],
            pico: [
              { $group: { _id: { $hour: { date: "$createdAt", timezone: "America/Sao_Paulo" } }, n: { $sum: 1 } } },
              { $sort: { n: -1 } },
              { $limit: 1 },
            ],
          },
        },
      ])
      .toArray(),
    uploads.find({ albumId: album._id }).sort({ createdAt: -1 }).limit(LIMITE_LISTA).toArray(),
    uploads
      .find({ albumId: album._id, legenda: { $exists: true } }, { projection: { legenda: 1, nomeConvidado: 1, createdAt: 1 } })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray(),
  ]);

  const geral = stats?.geral[0];
  const total = geral?.total ?? 0;
  const videos = geral?.videos ?? 0;
  const convidados = geral?.nomes.filter(Boolean).length ?? 0;
  const horaPico = stats?.pico[0]?._id;

  const link = `${process.env.NEXT_PUBLIC_APP_URL}/a/${slug}`;
  const [qrSvg, qrPng] = await Promise.all([
    QRCode.toString(link, { type: "svg", margin: 2 }),
    QRCode.toDataURL(link, { width: 1024, margin: 2 }),
  ]);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <BotaoVoltar href="/dashboard">Seus álbuns</BotaoVoltar>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          {album.tipoEvento && <p className="text-sm font-medium text-violet-600">{album.tipoEvento}</p>}
          <h1 className="flex flex-wrap items-center gap-3 text-3xl font-bold tracking-tight">
            {album.titulo}
            {!album.ativo && <EtiquetaPausado />}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/a/${slug}/editar`} className="btn-secundario">
            Editar
          </Link>
          <a
            href={`https://drive.google.com/drive/folders/${album.driveFolderId}`}
            target="_blank"
            rel="noreferrer"
            className="btn-secundario"
          >
            Drive ↗
          </a>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Quadro
          rotulo="Arquivos"
          valor={total.toLocaleString("pt-BR")}
          detalhe={`${(total - videos).toLocaleString("pt-BR")} fotos · ${videos.toLocaleString("pt-BR")} vídeos`}
        />
        <Quadro
          rotulo="Convidados"
          valor={convidados.toLocaleString("pt-BR")}
          detalhe={geral?.anonimos ? `+ ${geral.anonimos.toLocaleString("pt-BR")} envios sem nome` : "que deixaram o nome"}
        />
        <Quadro
          rotulo="Tamanho total"
          valor={formatarBytes(geral?.bytes ?? 0)}
          detalhe={horaPico !== undefined ? `Pico de envios às ${horaPico}h` : undefined}
        />
        <Quadro
          rotulo="Livre no Drive"
          valor={
            !drive.conectado ? (
              <span className="text-base font-medium text-amber-600">Desconectado</span>
            ) : drive.livreBytes === null ? (
              "Ilimitado"
            ) : (
              formatarBytes(drive.livreBytes)
            )
          }
        />
      </div>

      <section className="cartao mt-4 flex flex-col items-center gap-6 p-5 sm:flex-row">
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL gerada no servidor */}
        <img src={qrPng} alt={`QR code do álbum ${album.titulo}`} className="h-44 w-44 shrink-0 rounded-lg border border-zinc-200 bg-white p-1" />
        <div className="flex min-w-0 flex-col gap-3 text-center sm:text-left">
          <div>
            <h2 className="font-semibold">Link para os convidados</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Imprima o QR code nas mesas ou envie o link. Quem abrir já pode enviar fotos.
            </p>
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

      <section className="cartao mt-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold">Baixar tudo</h2>
            <p className="mt-1 text-sm text-zinc-500">Todos os arquivos ficam na pasta do álbum no seu Google Drive.</p>
          </div>
          <a
            href={`https://drive.google.com/drive/folders/${album.driveFolderId}`}
            target="_blank"
            rel="noreferrer"
            className="btn-primario"
          >
            Abrir pasta no Drive ↗
          </a>
        </div>
        <ol className="mt-4 grid gap-2 text-sm text-zinc-600 sm:grid-cols-3 dark:text-zinc-400">
          {[
            "Abra a pasta no Drive pelo botão acima.",
            "No computador, clique no nome da pasta no topo e escolha “Fazer download”.",
            "O Google prepara um arquivo .zip com tudo. Em álbuns grandes, ele pode vir dividido em partes.",
          ].map((passo, i) => (
            <li key={i} className="flex gap-2 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                {i + 1}
              </span>
              {passo}
            </li>
          ))}
        </ol>
      </section>

      {recados.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Recados dos convidados</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {recados.map((r) => (
              <li key={r._id.toString()} className="cartao p-4">
                <p className="whitespace-pre-line text-sm leading-relaxed">“{r.legenda}”</p>
                <p className="mt-2 text-xs text-zinc-500">
                  {r.nomeConvidado ?? "Anônimo"} ·{" "}
                  {r.createdAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Envios</h2>
        {lista.length === 0 ? (
          <div className="cartao mt-4 px-6 py-10 text-center text-sm text-zinc-500">
            Nenhum arquivo recebido ainda. Compartilhe o link ou o QR code com os convidados.
          </div>
        ) : (
          <ul className="cartao mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
            {lista.map((u) => (
              <li key={u.driveFileId} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${
                    u.mimeType.startsWith("video/")
                      ? "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
                      : "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                  }`}
                >
                  {u.mimeType.startsWith("video/") ? "VÍDEO" : "FOTO"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{u.nomeArquivo}</p>
                  <p className="truncate text-xs text-zinc-500">
                    {[
                      u.nomeConvidado ?? "Anônimo",
                      formatarBytes(u.tamanhoBytes),
                      u.createdAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }),
                    ].join(" · ")}
                  </p>
                </div>
                <a
                  href={`https://drive.google.com/file/d/${u.driveFileId}/view`}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-sm font-medium text-violet-600 hover:text-violet-700"
                >
                  Ver ↗
                </a>
              </li>
            ))}
          </ul>
        )}
        {total > LIMITE_LISTA && (
          <p className="mt-2 text-xs text-zinc-500">Mostrando os {LIMITE_LISTA} mais recentes. Todos estão no Drive.</p>
        )}
      </section>

      <AcoesAlbum slug={slug} ativo={album.ativo} />
    </main>
  );
}
