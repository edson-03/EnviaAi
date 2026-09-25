import Link from "next/link";
import { formatarBytes } from "@/lib/formatar";
import { statusDrive } from "@/lib/google";
import { uploads } from "@/lib/mongodb";
import { BotaoCopiar } from "./botao-copiar";
import { albumDoDono, linkDoAlbum } from "./dados";

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

export default async function VisaoGeralPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { session, album } = await albumDoDono(slug);

  const [drive, [stats], recados] = await Promise.all([
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
  const link = linkDoAlbum(slug);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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

      <section className="cartao flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <h2 className="font-semibold">Link para os convidados</h2>
          <p className="mt-1 truncate font-mono text-xs text-zinc-500">{link}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <BotaoCopiar texto={link} />
          <Link href={`/dashboard/a/${slug}/compartilhar`} className="btn-primario">
            QR code e placa
          </Link>
        </div>
      </section>

      {recados.length > 0 && (
        <section className="mt-4">
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
            className="btn-secundario"
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
    </div>
  );
}
