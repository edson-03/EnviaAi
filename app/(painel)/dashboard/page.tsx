import Link from "next/link";
import { ObjectId } from "mongodb";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { auth } from "@/lib/auth";
import { statusDrive } from "@/lib/google";
import { albums, uploads } from "@/lib/mongodb";
import { BotaoCopiar } from "./a/[slug]/botao-copiar";
import { BotaoReconectar } from "./botao-reconectar";
import { EtiquetaPausado } from "./etiqueta-pausado";

const POUCO_ESPACO_BYTES = 1024 ** 3; // 1 GB

function formatarGB(bytes: number) {
  return `${(bytes / 1024 ** 3).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} GB`;
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/entrar");

  const [drive, lista] = await Promise.all([
    statusDrive(session.user.id),
    albums
      .find(
        { ownerId: new ObjectId(session.user.id) },
        { projection: { slug: 1, titulo: 1, tipoEvento: 1, dataEvento: 1, driveFolderId: 1, ativo: 1 } },
      )
      .sort({ createdAt: -1 })
      .toArray(),
  ]);

  const [qrPngs, contagens] = await Promise.all([
    Promise.all(
      lista.map((a) => QRCode.toDataURL(`${process.env.NEXT_PUBLIC_APP_URL}/a/${a.slug}`, { width: 1024, margin: 2 })),
    ),
    uploads
      .aggregate<{ _id: ObjectId; total: number }>([
        { $match: { albumId: { $in: lista.map((a) => a._id) } } },
        { $group: { _id: "$albumId", total: { $sum: 1 } } },
      ])
      .toArray(),
  ]);
  const totalPorAlbum = new Map(contagens.map((c) => [c._id.toString(), c.total]));

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">Olá, {session.user.name.split(" ")[0]}</p>
          <h1 className="text-3xl font-bold tracking-tight">Seus álbuns</h1>
        </div>
        {drive.conectado && (
          <Link href="/dashboard/novo" className="btn-primario">
            + Novo álbum
          </Link>
        )}
      </div>

      {drive.conectado && drive.livreBytes !== null && drive.livreBytes < POUCO_ESPACO_BYTES && (
        <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <strong>Seu Google Drive está quase cheio</strong> ({formatarGB(drive.livreBytes)} livres). Quando acabar o
          espaço, os convidados não conseguem mais enviar arquivos. Libere espaço ou aumente o armazenamento em{" "}
          <a href="https://one.google.com/storage" target="_blank" rel="noreferrer" className="underline">
            one.google.com/storage
          </a>
          .
        </div>
      )}

      {drive.conectado ? (
        <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Google Drive conectado
          {drive.livreBytes !== null && <> · {formatarGB(drive.livreBytes)} livres</>}
        </p>
      ) : (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <p>Perdemos o acesso ao seu Google Drive. Reconecte para voltar a receber as fotos.</p>
          <BotaoReconectar />
        </div>
      )}

      {lista.length === 0 ? (
        <div className="cartao mt-8 flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-950">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M4 8a2 2 0 0 1 2-2h1.5l1.5-2h6l1.5 2H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" strokeLinejoin="round" />
              <circle cx="12" cy="12.5" r="3.5" />
            </svg>
          </span>
          <h2 className="text-lg font-semibold">Crie seu primeiro álbum</h2>
          <p className="max-w-sm text-sm text-zinc-500">
            Em menos de um minuto você tem um link e um QR code para os convidados enviarem as fotos.
          </p>
          {drive.conectado && (
            <Link href="/dashboard/novo" className="btn-primario mt-2">
              Criar álbum
            </Link>
          )}
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {lista.map((a, i) => {
            const total = totalPorAlbum.get(a._id.toString()) ?? 0;
            return (
              <li key={a.slug} className="cartao flex flex-col p-5 transition hover:border-violet-300 dark:hover:border-violet-800">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/dashboard/a/${a.slug}`} className="block truncate text-lg font-semibold hover:text-violet-600">
                      {a.titulo}
                    </Link>
                    <p className="mt-1 text-sm text-zinc-500">
                      {[a.tipoEvento, a.dataEvento?.toLocaleDateString("pt-BR", { timeZone: "UTC" })]
                        .filter(Boolean)
                        .join(" · ") || "Sem data"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="rounded-full bg-violet-600/10 px-2.5 py-1 text-xs font-medium text-violet-700 dark:text-violet-300">
                      {total} {total === 1 ? "arquivo" : "arquivos"}
                    </span>
                    {!a.ativo && <EtiquetaPausado />}
                  </div>
                </div>

                <Link
                  href={`/a/${a.slug}`}
                  target="_blank"
                  className="mt-3 truncate text-xs text-zinc-400 hover:text-violet-600"
                >
                  /a/{a.slug} ↗
                </Link>

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                  <Link href={`/dashboard/a/${a.slug}`} className="btn-primario">
                    Ver envios
                  </Link>
                  <BotaoCopiar texto={`${process.env.NEXT_PUBLIC_APP_URL}/a/${a.slug}`} />
                  <a href={qrPngs[i]} download={`qrcode-${a.slug}.png`} className="btn-secundario">
                    QR code
                  </a>
                  <a
                    href={`https://drive.google.com/drive/folders/${a.driveFolderId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto text-sm font-medium text-zinc-500 hover:text-violet-600"
                  >
                    Drive ↗
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-12 text-center text-sm">
        <Link href="/dashboard/conta" className="text-zinc-500 hover:text-violet-600">
          Sua conta
        </Link>
      </p>
    </main>
  );
}
