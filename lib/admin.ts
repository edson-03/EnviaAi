// Acesso ao painel /admin. Somente servidor.
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "./auth";

export function ehAdmin(email: string | undefined | null) {
  if (!email) return false;
  const lista = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
  return lista.includes(email.toLowerCase());
}

// Para quem não é admin, o /admin responde 404 (não revela que existe).
export async function exigirAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !ehAdmin(session.user.email)) notFound();
  return session;
}
