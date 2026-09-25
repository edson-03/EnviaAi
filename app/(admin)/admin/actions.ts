"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/admin";
import { albums, db } from "@/lib/mongodb";

const PLANOS = ["free", "premium"];

export async function definirPlano(userId: string, plano: string) {
  await exigirAdmin();
  if (!PLANOS.includes(plano)) return;
  await db.collection("user").updateOne({ _id: new ObjectId(userId) }, { $set: { plano } });
  revalidatePath("/admin", "layout");
}

// Suspender: bloqueia login (ver lib/auth.ts), encerra as sessões e para os envios dos álbuns dele.
export async function definirSuspensaoUsuario(userId: string, suspenso: boolean) {
  const admin = await exigirAdmin();
  if (userId === admin.user.id) return; // não suspender a si mesmo
  const _id = new ObjectId(userId);
  await db.collection("user").updateOne({ _id }, { $set: { suspenso } });
  if (suspenso) await db.collection("session").deleteMany({ userId: _id });
  revalidatePath("/admin", "layout");
}

export async function definirSuspensaoAlbum(albumId: string, suspenso: boolean) {
  await exigirAdmin();
  await albums.updateOne({ _id: new ObjectId(albumId) }, suspenso ? { $set: { suspenso: true } } : { $unset: { suspenso: 1 } });
  revalidatePath("/admin", "layout");
}
