import Link from "next/link";
import { ObjectId } from "mongodb";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { auth } from "@/lib/auth";
import { statusDrive } from "@/lib/google";
import { albums } from "@/lib/mongodb";
import { BotaoCopiar } from "./a/[slug]/botao-copiar";
import { BotaoReconectar } from "./botao-reconectar";
import { BotaoSair } from "./botao-sair";

function formatarGB(bytes: number) {
  return `${(bytes / 1024 ** 3).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} GB`;
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/entrar");

  const [drive, lista] = await Promise.all([
    statusDrive(session.user.id),
    albums
      .find({ ownerId: new ObjectId(session.user.id) }, { projection: { slug: 1, titulo: 1, tipoEvento: 1, dataEvento: 1, driveFolderId: 1 } })
      .sort({ createdAt: -1 })
      .toArray(),
  ]);

  const qrPngs = await Promise.all(
    lista.map((a) => QRCode.toDataURL(`${process.env.NEXT_PUBLIC_APP_URL}/a/${a.slug}`, { width: 1024, margin: 2 })),
  );

  return (
    <main className="mx-auto w-full max-w-3xl p-4">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Olá, {session.user.name}</h1>
          <p className="text-sm text-zinc-500">{session.user.email}</p>
        </div>
        <BotaoSair />
      </header>

      <section className="mt-6 flex items-center justify-between gap-4 rounded-lg border p-4">
        {drive.conectado ? (
          <p className="text-sm">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-500" />
            Google Drive conectado
            {drive.livreBytes !== null && <> · {formatarGB(drive.livreBytes)} livres</>}
          </p>
        ) : (
          <>
            <p className="text-sm">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-amber-500" />
              Perdemos o acesso ao seu Google Drive. Reconecte para receber as fotos.
            </p>
            <BotaoReconectar />
          </>
        )}
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Seus álbuns</h2>
          {drive.conectado && (
            <Link
              href="/dashboard/novo"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Novo álbum
            </Link>
          )}
        </div>

        {lista.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">Nenhum álbum ainda.</p>
        ) : (
          <ul className="mt-4 divide-y rounded-lg border">
            {lista.map((a, i) => (
              <li key={a.slug} className="flex flex-wrap items-center justify-between gap-2 p-4">
                <div>
                  <Link href={`/dashboard/a/${a.slug}`} className="font-medium hover:underline">
                    {a.titulo}
                  </Link>
                  <p className="text-sm text-zinc-500">
                    {[a.tipoEvento, a.dataEvento?.toLocaleDateString("pt-BR", { timeZone: "UTC" })]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <Link href={`/a/${a.slug}`} target="_blank" className="text-xs text-zinc-500 hover:underline">
                    /a/{a.slug}
                  </Link>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <BotaoCopiar texto={`${process.env.NEXT_PUBLIC_APP_URL}/a/${a.slug}`} />
                  <a
                    href={qrPngs[i]}
                    download={`qrcode-${a.slug}.png`}
                    className="rounded-lg border px-3 py-2 text-sm hover:bg-zinc-100"
                  >
                    Baixar QR code
                  </a>
                  <a
                    href={`https://drive.google.com/drive/folders/${a.driveFolderId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Abrir no Drive
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
