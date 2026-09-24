"use server";

import { randomBytes } from "node:crypto";
import { ObjectId, MongoServerError } from "mongodb";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { criarPasta, DriveDesconectado } from "@/lib/google";
import { albums } from "@/lib/mongodb";
import { TIPOS_EVENTO } from "./tipos-evento";

export type EstadoForm = { erro?: string };

// "Casamento Ana & Léo" -> "casamento-ana-leo-k3x9p". O sufixo impede adivinhar álbuns.
function gerarSlug(titulo: string) {
  const base = titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
  const sufixo = Array.from(randomBytes(5), (b) => "abcdefghijkmnpqrstuvwxyz23456789"[b % 32]).join("");
  return base ? `${base}-${sufixo}` : sufixo;
}

export async function criarAlbum(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/entrar");

  const titulo = String(form.get("titulo") ?? "").trim();
  const tipoEvento = String(form.get("tipoEvento") ?? "");
  const data = String(form.get("dataEvento") ?? "");

  if (!titulo || titulo.length > 120) return { erro: "Informe um título de até 120 caracteres." };
  if (tipoEvento && !TIPOS_EVENTO.includes(tipoEvento)) return { erro: "Tipo de evento inválido." };
  const dataEvento = data ? new Date(`${data}T00:00:00Z`) : undefined;
  if (dataEvento && isNaN(dataEvento.getTime())) return { erro: "Data inválida." };

  let driveFolderId: string;
  try {
    driveFolderId = await criarPasta(session.user.id, `Enviaí - ${titulo}`);
  } catch (e) {
    if (e instanceof DriveDesconectado) return { erro: "Reconecte seu Google Drive no painel e tente de novo." };
    throw e;
  }

  for (let tentativa = 0; ; tentativa++) {
    try {
      await albums.insertOne({
        _id: new ObjectId(),
        ownerId: new ObjectId(session.user.id),
        slug: gerarSlug(titulo),
        titulo,
        ...(tipoEvento && { tipoEvento }),
        ...(dataEvento && { dataEvento }),
        driveFolderId,
        corTema: "#18181b",
        galeriaPublica: false,
        ativo: true,
        createdAt: new Date(),
      });
      break;
    } catch (e) {
      // Slug repetido (código 11000): tenta outro sufixo.
      if (!(e instanceof MongoServerError && e.code === 11000) || tentativa >= 2) throw e;
    }
  }

  redirect("/dashboard");
}
