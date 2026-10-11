import { corDoAlbum } from "@/lib/cores";
import { albumDoDono } from "../dados";
import { Caixinha } from "./caixinha";

export default async function CaixinhaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { album } = await albumDoDono(slug);
  return <Caixinha titulo={album.titulo} cor={corDoAlbum(album.corTema)} />;
}
