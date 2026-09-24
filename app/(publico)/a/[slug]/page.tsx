import { notFound } from "next/navigation";
import { albums, db } from "@/lib/mongodb";
import { EnvioConvidado } from "./envio-convidado";

export default async function AlbumPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const album = await albums.findOne(
    { slug, ativo: true },
    { projection: { titulo: 1, mensagemBoasVindas: 1, ownerId: 1 } },
  );
  if (!album) notFound();

  const dono = await db.collection("user").findOne({ _id: album.ownerId }, { projection: { name: 1 } });

  return (
    <main className="mx-auto w-full max-w-lg p-4">
      <h1 className="text-2xl font-bold">{album.titulo}</h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
        {album.mensagemBoasVindas ?? "Envie suas fotos e vídeos do evento."}
      </p>

      <EnvioConvidado slug={slug} />

      <p className="mt-8 text-xs text-zinc-500">
        Os arquivos enviados vão para o Google Drive de {dono?.name ?? "quem organizou o evento"}, responsável
        por eles. Não é preciso criar conta.
      </p>
    </main>
  );
}
