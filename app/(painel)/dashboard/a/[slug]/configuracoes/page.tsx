import { AcoesAlbum } from "../acoes-album";
import { editarAlbum } from "../actions";
import { albumDoDono } from "../dados";
import { FormEditar } from "./form-editar";

export default async function ConfiguracoesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { album } = await albumDoDono(slug);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem] lg:items-start">
      <div className="cartao p-6">
        <h2 className="text-lg font-semibold">Dados do álbum</h2>
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
      <AcoesAlbum slug={slug} ativo={album.ativo} />
    </div>
  );
}
