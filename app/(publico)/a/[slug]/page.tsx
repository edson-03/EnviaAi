import Link from "next/link";
import { notFound } from "next/navigation";
import { corDoAlbum } from "@/lib/cores";
import { albums, db } from "@/lib/mongodb";
import { EnvioConvidado } from "./envio-convidado";

export default async function AlbumPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const album = await albums.findOne(
    { slug },
    {
      projection: {
        titulo: 1, tipoEvento: 1, mensagemBoasVindas: 1, ownerId: 1, ativo: 1, suspenso: 1, corTema: 1, capaDriveFileId: 1,
      },
    },
  );
  if (!album) notFound();

  const dono = await db.collection("user").findOne({ _id: album.ownerId }, { projection: { name: 1, suspenso: 1 } });
  const cor = corDoAlbum(album.corTema);

  // Suspenso pelo /admin (álbum ou dono): não mostra nada do evento.
  if (album.suspenso || dono?.suspenso) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <p className="text-lg font-semibold">Álbum indisponível</p>
        <p className="mt-1 text-sm text-zinc-500">Este álbum não está disponível no momento.</p>
      </main>
    );
  }

  return (
    // --cor: cor escolhida pelo organizador; os tons claros saem dela com color-mix.
    <div
      className="flex-1 bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--cor)_18%,transparent),transparent_420px)]"
      style={{ ["--cor" as string]: cor }}
    >
      {album.capaDriveFileId && (
        // eslint-disable-next-line @next/next/no-img-element -- capa servida pela nossa rota a partir do Drive
        <img
          src={`/api/capa/${slug}?v=${album.capaDriveFileId}`}
          alt=""
          className="h-48 w-full object-cover sm:h-64"
        />
      )}
      <main className="mx-auto w-full max-w-lg px-4 py-10">
        <div className="text-center">
          {album.tipoEvento && (
            <span className="inline-block rounded-full bg-[color-mix(in_srgb,var(--cor)_12%,transparent)] px-3 py-1 text-xs font-medium text-[var(--cor)]">
              {album.tipoEvento}
            </span>
          )}
          <h1 className="mt-3 text-3xl font-bold tracking-tight">{album.titulo}</h1>
          <p className="mt-2 whitespace-pre-line text-zinc-600 dark:text-zinc-400">
            {album.mensagemBoasVindas ?? "Compartilhe suas fotos e vídeos deste momento."}
          </p>
        </div>

        {album.ativo ? (
          <EnvioConvidado slug={slug} />
        ) : (
          <div className="cartao mt-8 p-6 text-center">
            <p className="font-semibold">Este álbum não está recebendo arquivos no momento</p>
            <p className="mt-1 text-sm text-zinc-500">Fale com quem organizou o evento.</p>
          </div>
        )}

        <footer className="mt-10 space-y-3 text-center text-xs text-zinc-500">
          <p>
            Os arquivos enviados vão para o Google Drive de {dono?.name ?? "quem organizou o evento"}, responsável
            por eles. Não é preciso criar conta.
          </p>
          <p>
            Feito com{" "}
            <Link href="/" className="font-semibold text-zinc-700 hover:text-violet-600 dark:text-zinc-300">
              Envia<span className="text-violet-600">í</span>
            </Link>
            {" · "}
            <Link href="/privacidade" className="hover:text-violet-600">
              Privacidade
            </Link>
            {" · "}
            <Link href="/termos" className="hover:text-violet-600">
              Termos
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
