"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { albums, uploads } from "@/lib/mongodb";

async function donoId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/entrar");
  return new ObjectId(session.user.id);
}

export async function definirAtivo(slug: string, ativo: boolean) {
  await albums.updateOne({ slug, ownerId: await donoId() }, { $set: { ativo } });
  revalidatePath(`/dashboard/a/${slug}`);
}

// Apaga o álbum e os registros de envio. A pasta e os arquivos continuam no Drive do dono.
export async function excluirAlbum(slug: string) {
  const album = await albums.findOneAndDelete({ slug, ownerId: await donoId() }, { projection: { _id: 1 } });
  if (album) await uploads.deleteMany({ albumId: album._id });
  redirect("/dashboard");
}
