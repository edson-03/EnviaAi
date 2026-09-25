"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { renomearPasta } from "@/lib/google";
import { albums, uploads } from "@/lib/mongodb";
import { lerCamposAlbum } from "../../novo/campos-album";
import type { EstadoForm } from "../../novo/actions";

async function donoId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/entrar");
  return new ObjectId(session.user.id);
}

export async function definirAtivo(slug: string, ativo: boolean) {
  await albums.updateOne({ slug, ownerId: await donoId() }, { $set: { ativo } });
  revalidatePath(`/dashboard/a/${slug}`);
}

// O slug não muda: links e QR codes já distribuídos continuam valendo.
export async function editarAlbum(slug: string, _: EstadoForm, form: FormData): Promise<EstadoForm> {
  const ownerId = await donoId();
  const lido = lerCamposAlbum(form);
  if ("erro" in lido) return lido;
  const { titulo, tipoEvento, dataEvento, mensagemBoasVindas } = lido.campos;

  // Campo opcional vazio = remover do documento ($unset não pode ir vazio).
  const opcionais = { tipoEvento, dataEvento, mensagemBoasVindas };
  const set = { titulo, ...Object.fromEntries(Object.entries(opcionais).filter(([, v]) => v !== undefined)) };
  const unset = Object.fromEntries(Object.entries(opcionais).filter(([, v]) => v === undefined).map(([k]) => [k, 1 as const]));

  const antes = await albums.findOneAndUpdate(
    { slug, ownerId },
    Object.keys(unset).length ? { $set: set, $unset: unset } : { $set: set },
    { projection: { titulo: 1, driveFolderId: 1 } },
  );
  if (!antes) redirect("/dashboard");

  if (antes.titulo !== titulo) {
    try {
      await renomearPasta(ownerId.toString(), antes.driveFolderId, `Enviaí - ${titulo}`);
    } catch (e) {
      console.error("Não foi possível renomear a pasta do álbum", e); // edição já salva; nome da pasta é secundário
    }
  }

  revalidatePath(`/dashboard/a/${slug}`);
  redirect(`/dashboard/a/${slug}`);
}

// Apaga o álbum e os registros de envio. A pasta e os arquivos continuam no Drive do dono.
export async function excluirAlbum(slug: string) {
  const album = await albums.findOneAndDelete({ slug, ownerId: await donoId() }, { projection: { _id: 1 } });
  if (album) await uploads.deleteMany({ albumId: album._id });
  redirect("/dashboard");
}
