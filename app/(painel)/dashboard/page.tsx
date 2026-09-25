import Link from "next/link";
import { ObjectId } from "mongodb";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { auth } from "@/lib/auth";
import { primeiroNome } from "@/lib/formatar";
import { statusDrive } from "@/lib/google";
import { albums, uploads } from "@/lib/mongodb";
import { BotaoCopiar } from "./a/[slug]/botao-copiar";
import { BotaoReconectar } from "./botao-reconectar";

const POUCO_ESPACO_BYTES = 1024 ** 3; // 1 GB

// Uma capa por álbum, escolhida pelo slug (sempre a mesma para o mesmo álbum).
const CAPAS = [
  "from-violet-500 to-fuchsia-500",
  "from-sky-500 to-indigo-500",
  "from-amber-400 to-rose-500",
  "from-emerald-400 to-teal-600",
  "from-pink-500 to-violet-600",
  "from-orange-400 to-pink-500",
];

function capaDoAlbum(slug: string) {
  let h = 0;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return CAPAS[h % CAPAS.length];
}

function formatarGB(bytes: number) {
  return `${(bytes / 1024 ** 3).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} GB`;
}

function Resumo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="cartao px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{rotulo}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{valor}</p>
    </div>
  );
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
  const totalArquivos = contagens.reduce((soma, c) => soma + c.total, 0);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">Olá, {primeiroNome(session.user.name)}</p>
          <h1 className="text-3xl font-bold tracking-tight">Seus álbuns</h1>
        </div>
        {drive.conectado && lista.length > 0 && (
          <Link href="/dashboard/novo" className="btn-primario">
            + Novo álbum
          </Link>
        )}
      </div>

      {!drive.conectado && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <p>Perdemos o acesso ao seu Google Drive. Reconecte para voltar a receber as fotos.</p>
          <BotaoReconectar />
        </div>
      )}
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

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Resumo rotulo="Álbuns" valor={lista.length.toLocaleString("pt-BR")} />
        <Resumo rotulo="Arquivos recebidos" valor={totalArquivos.toLocaleString("pt-BR")} />
        <div className="cartao col-span-2 px-5 py-4 sm:col-span-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Google Drive</p>
          <p className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight">
            <span className={`h-2.5 w-2.5 rounded-full ${drive.conectado ? "bg-green-500" : "bg-amber-500"}`} />
            {!drive.conectado
              ? "Desconectado"
              : drive.livreBytes === null
                ? "Ilimitado"
                : `${formatarGB(drive.livreBytes)} livres`}
          </p>
        </div>
      </div>

      {lista.length === 0 ? (
        <div className="cartao mt-8 flex flex-col items-center gap-3 px-6 py-16 text-center">
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
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((a, i) => {
            const total = totalPorAlbum.get(a._id.toString()) ?? 0;
            const link = `${process.env.NEXT_PUBLIC_APP_URL}/a/${a.slug}`;
            return (
              <li
                key={a.slug}
                className="cartao group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <Link href={`/dashboard/a/${a.slug}`} className={`relative block h-28 bg-gradient-to-br ${capaDoAlbum(a.slug)}`}>
                  <span
                    className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur ${
                      a.ativo ? "bg-white/85 text-green-700" : "bg-white/85 text-amber-700"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${a.ativo ? "bg-green-500" : "bg-amber-500"}`} />
                    {a.ativo ? "Recebendo" : "Pausado"}
                  </span>
                  {a.dataEvento && (
                    <span className="absolute right-3 top-3 flex w-12 flex-col items-center overflow-hidden rounded-lg bg-white text-center shadow">
                      <span className="w-full bg-zinc-900 py-0.5 text-[10px] font-semibold uppercase text-white">
                        {a.dataEvento.toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" }).replace(".", "")}
                      </span>
                      <span className="py-0.5 text-lg font-bold leading-tight text-zinc-900">
                        {a.dataEvento.toLocaleDateString("pt-BR", { day: "2-digit", timeZone: "UTC" })}
                      </span>
                    </span>
                  )}
                </Link>

                <div className="flex flex-1 flex-col p-5">
                  <Link href={`/dashboard/a/${a.slug}`} className="truncate text-lg font-semibold group-hover:text-violet-600">
                    {a.titulo}
                  </Link>
                  <p className="mt-1 text-sm text-zinc-500">
                    {[a.tipoEvento, a.dataEvento?.toLocaleDateString("pt-BR", { timeZone: "UTC" })].filter(Boolean).join(" · ") ||
                      "Sem data definida"}
                  </p>
                  <p className="mt-3 text-sm">
                    <span className="font-semibold">{total.toLocaleString("pt-BR")}</span>{" "}
                    <span className="text-zinc-500">{total === 1 ? "arquivo recebido" : "arquivos recebidos"}</span>
                  </p>

                  <div className="mt-5 flex items-center gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                    <Link href={`/dashboard/a/${a.slug}`} className="btn-primario px-3 py-1.5">
                      Abrir
                    </Link>
                    <BotaoCopiar texto={link} className="btn-secundario px-3 py-1.5" />
                    <a
                      href={qrPngs[i]}
                      download={`qrcode-${a.slug}.png`}
                      className="btn-secundario px-3 py-1.5"
                      title="Baixar QR code"
                    >
                      QR
                    </a>
                    <a
                      href={`https://drive.google.com/drive/folders/${a.driveFolderId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-auto text-sm font-medium text-zinc-400 hover:text-violet-600"
                      title="Abrir pasta no Google Drive"
                    >
                      Drive ↗
                    </a>
                  </div>
                </div>
              </li>
            );
          })}

          {drive.conectado && (
            <li>
              <Link
                href="/dashboard/novo"
                className="flex h-full min-h-60 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 text-zinc-500 transition hover:border-violet-400 hover:bg-violet-50 hover:text-violet-600 dark:border-zinc-700 dark:hover:border-violet-700 dark:hover:bg-violet-950/30"
              >
                <span className="text-3xl leading-none">+</span>
                <span className="font-medium">Novo álbum</span>
              </Link>
            </li>
          )}
        </ul>
      )}
    </main>
  );
}
