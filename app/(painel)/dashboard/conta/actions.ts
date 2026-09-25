"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { obterAccessToken } from "@/lib/google";
import { albums, db, uploads } from "@/lib/mongodb";

export type EstadoExclusao = { erro?: string };

export async function definirResumoEmail(ativo: boolean) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/entrar");
  await db.collection("user").updateOne({ _id: new ObjectId(session.user.id) }, { $set: { resumoEmail: ativo } });
  revalidatePath("/dashboard/conta");
}

// Apaga todos os dados do usuário no Enviaí. Pastas e arquivos continuam no Google Drive dele.
export async function excluirConta(_: EstadoExclusao, form: FormData): Promise<EstadoExclusao> {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) redirect("/entrar");
  if (String(form.get("confirmacao") ?? "").trim() !== "EXCLUIR") {
    return { erro: "Digite EXCLUIR para confirmar." };
  }

  const userId = new ObjectId(session.user.id);

  // Revogar o access token também revoga o refresh token: o app sai das permissões da conta Google.
  try {
    const token = await obterAccessToken(session.user.id);
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, { method: "POST" });
  } catch (e) {
    console.error("Não foi possível revogar o acesso ao Google", e); // segue com a exclusão
  }

  const idsAlbuns = (await albums.find({ ownerId: userId }, { projection: { _id: 1 } }).toArray()).map((a) => a._id);
  await uploads.deleteMany({ albumId: { $in: idsAlbuns } });
  await albums.deleteMany({ ownerId: userId });

  await auth.api.signOut({ headers: h }); // limpa o cookie de sessão
  await Promise.all([
    db.collection("session").deleteMany({ userId }),
    db.collection("account").deleteMany({ userId }),
    db.collection("user").deleteOne({ _id: userId }),
  ]);

  redirect("/");
}
