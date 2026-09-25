import { corDoAlbum } from "@/lib/cores";
import { albumDoDono } from "../dados";
import { FormPersonalizar } from "./form-personalizar";

export default async function PersonalizarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { album } = await albumDoDono(slug);

  return (
    <FormPersonalizar
      slug={slug}
      titulo={album.titulo}
      cor={corDoAlbum(album.corTema)}
      capaUrl={album.capaDriveFileId ? `/api/capa/${slug}?v=${album.capaDriveFileId}` : undefined}
    />
  );
}
