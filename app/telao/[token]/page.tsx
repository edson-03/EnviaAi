import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { corDoAlbum } from "@/lib/cores";
import { albumDoTelao } from "@/lib/telao";
import { Slideshow } from "./slideshow";

export const metadata: Metadata = { title: "Telão · Enviaí", robots: { index: false } };

export default async function TelaoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const album = await albumDoTelao(token);
  if (!album) notFound();

  const linkAlbum = `${process.env.NEXT_PUBLIC_APP_URL}/a/${album.slug}`;
  const qr = await QRCode.toDataURL(linkAlbum, { width: 512, margin: 1 });

  return <Slideshow token={token} titulo={album.titulo} cor={corDoAlbum(album.corTema)} qr={qr} />;
}
