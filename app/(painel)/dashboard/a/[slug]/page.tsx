import Link from "next/link";
import { ObjectId } from "mongodb";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { auth } from "@/lib/auth";
import { statusDrive } from "@/lib/google";
import { albums, uploads } from "@/lib/mongodb";
import { BotaoCopiar } from "./botao-copiar";

const LIMITE_LISTA = 200;

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

  const [drive, total, lista] = await Promise.all([
    statusDrive(session.user.id),
    uploads.countDocuments({ albumId: album._id }),
    uploads.find({ albumId: album._id }).sort({ createdAt: -1 }).limit(LIMITE_LISTA).toArray(),
  ]);

  const link = `${process.env.NEXT_PUBLIC_APP_URL}/a/${slug}`;
  const [qrSvg, qrPng] = await Promise.all([
    QRCode.toString(link, { type: "svg", margin: 2 }),
    QRCode.toDataURL(link, { width: 1024, margin: 2 }),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl p-4">
      <Link href="/dashboard" className="text-sm text-zinc-500 hover:underline">
        ← Voltar
      </Link>
      <h1 className="mt-2 text-2xl font-bold">{album.titulo}</h1>
      <p className="text-sm text-zinc-500">
        {total} {total === 1 ? "arquivo recebido" : "arquivos recebidos"}
        {drive.conectado && drive.livreBytes !== null && <> · {formatarBytes(drive.livreBytes)} livres no Drive</>}
        {!drive.conectado && <> · Drive desconectado, reconecte no painel</>}
      </p>

      <section className="mt-6 flex flex-col items-center gap-4 rounded-lg border p-4 sm:flex-row sm:items-start">
        <div className="w-48 shrink-0 bg-white" dangerouslySetInnerHTML={{ __html: qrSvg }} />
        <div className="flex min-w-0 flex-col gap-3">
          <p className="break-all text-sm">{link}</p>
          <div className="flex flex-wrap gap-2">
            <BotaoCopiar texto={link} />
            <a href={qrPng} download={`qrcode-${slug}.png`} className="rounded-lg border px-3 py-2 text-sm hover:bg-zinc-100">
              Baixar PNG
            </a>
            <a
              href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg)}`}
              download={`qrcode-${slug}.svg`}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-zinc-100"
            >
              Baixar SVG
            </a>
            <a
              href={`https://drive.google.com/drive/folders/${album.driveFolderId}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border px-3 py-2 text-sm hover:bg-zinc-100"
            >
              Abrir no Drive
            </a>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Envios</h2>
        {lista.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">Nenhum arquivo recebido ainda.</p>
        ) : (
          <ul className="mt-4 divide-y rounded-lg border">
            {lista.map((u) => (
              <li key={u.driveFileId} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{u.nomeArquivo}</p>
                  <p className="text-zinc-500">
                    {[
                      u.nomeConvidado,
                      formatarBytes(u.tamanhoBytes),
                      u.createdAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <a
                  href={`https://drive.google.com/file/d/${u.driveFileId}/view`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Ver
                </a>
              </li>
            ))}
          </ul>
        )}
        {total > LIMITE_LISTA && (
          <p className="mt-2 text-xs text-zinc-500">Mostrando os {LIMITE_LISTA} mais recentes. Todos estão no Drive.</p>
        )}
      </section>
    </main>
  );
}
