import Link from "next/link";
import { ObjectId } from "mongodb";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { albums } from "@/lib/mongodb";
import { editarAlbum } from "../actions";
import { FormEditar } from "./form-editar";

export default async function EditarAlbumPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/entrar");

  const { slug } = await params;
  const album = await albums.findOne({ slug, ownerId: new ObjectId(session.user.id) });
  if (!album) notFound();

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-8">
      <Link href={`/dashboard/a/${slug}`} className="text-sm text-zinc-500 hover:text-violet-600">
        ← {album.titulo}
      </Link>
      <div className="cartao mt-4 p-6">
        <h1 className="text-2xl font-bold tracking-tight">Editar álbum</h1>
        <p className="mt-1 text-sm text-zinc-500">O link e o QR code continuam os mesmos.</p>
        <FormEditar
          acao={editarAlbum.bind(null, slug)}
          valores={{
            titulo: album.titulo,
            tipoEvento: album.tipoEvento,
            dataEvento: album.dataEvento?.toISOString().slice(0, 10),
            mensagemBoasVindas: album.mensagemBoasVindas,
          }}
        />
      </div>
    </main>
  );
}
