import Link from "next/link";
import { notFound } from "next/navigation";
import { albums, db } from "@/lib/mongodb";
import { EnvioConvidado } from "./envio-convidado";

export default async function AlbumPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const album = await albums.findOne(
    { slug },
    { projection: { titulo: 1, tipoEvento: 1, mensagemBoasVindas: 1, ownerId: 1, ativo: 1 } },
  );
  if (!album) notFound();

  const dono = await db.collection("user").findOne({ _id: album.ownerId }, { projection: { name: 1 } });

  return (
    <div className="flex-1 bg-gradient-to-b from-violet-100 via-white to-white dark:from-violet-950/50 dark:via-zinc-950 dark:to-zinc-950">
      <main className="mx-auto w-full max-w-lg px-4 py-10">
        <div className="text-center">
          {album.tipoEvento && (
            <span className="inline-block rounded-full bg-violet-600/10 px-3 py-1 text-xs font-medium text-violet-700 dark:text-violet-300">
              {album.tipoEvento}
            </span>
          )}
          <h1 className="mt-3 text-3xl font-bold tracking-tight">{album.titulo}</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
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
