import { ConvitePremium } from "@/components/convite-premium";
import { corDoAlbum } from "@/lib/cores";
import { albumDoDono } from "../dados";
import { FormPersonalizar } from "./form-personalizar";

export default async function PersonalizarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { album, situacao } = await albumDoDono(slug);

  if (!situacao.plano.personalizacao) {
    return (
      <ConvitePremium
        slug={slug}
        titulo="Cor do evento e foto de capa"
        texto="Deixe a página dos convidados com a cara da festa: escolha a cor e coloque uma foto de capa no topo."
      />
    );
  }

  return (
    <FormPersonalizar
      slug={slug}
      titulo={album.titulo}
      cor={corDoAlbum(album.corTema)}
      capaUrl={album.capaDriveFileId ? `/api/capa/${slug}?v=${album.capaDriveFileId}` : undefined}
    />
  );
}
