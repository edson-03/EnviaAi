"use server";

import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CORES_TEMA } from "@/lib/cores";
import { apagarArquivo, DriveDesconectado, enviarArquivoPequeno, renomearPasta } from "@/lib/google";
import { criarCheckout } from "@/lib/mercadopago";
import { albums, mensagens, uploads } from "@/lib/mongodb";
import { mensagemLimiteAtivos, planosAVenda, podeTerMaisUmAlbumAtivo, situacaoDoAlbum } from "@/lib/planos";
import { lerCamposAlbum } from "../../novo/campos-album";
import type { EstadoForm } from "../../novo/actions";

async function donoId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/entrar");
  return new ObjectId(session.user.id);
}

// Álbum do dono logado + plano valendo agora. Redireciona se não existir.
async function albumComPlano(slug: string) {
  const ownerId = await donoId();
  const album = await albums.findOne({ slug, ownerId });
  if (!album) redirect("/dashboard");
  return { ownerId, album, situacao: await situacaoDoAlbum(album) };
}

export async function definirAtivo(slug: string, ativo: boolean): Promise<EstadoForm> {
  const { ownerId, album, situacao } = await albumComPlano(slug);
  if (ativo && !situacao.pago && !(await podeTerMaisUmAlbumAtivo(ownerId, album._id))) {
    return { erro: await mensagemLimiteAtivos() };
  }
  await albums.updateOne({ _id: album._id }, { $set: { ativo } });
  revalidatePath(`/dashboard/a/${slug}`, "layout");
  return {};
}

// Vai para a página de pagamento do Mercado Pago do plano escolhido (só se o álbum não tiver plano pago vigente).
export async function iniciarPagamento(slug: string, planoId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/entrar");
  const album = await albums.findOne({ slug, ownerId: new ObjectId(session.user.id) });
  if (!album) redirect("/dashboard");
  const plano = (await planosAVenda()).find((p) => p._id === planoId);
  const { pago } = await situacaoDoAlbum(album, (session.user as { plano?: string }).plano ?? null);
  if (!plano || pago) redirect(`/dashboard/a/${slug}/premium`);
  redirect(await criarCheckout(album, plano, session.user.email));
}

// Cria (ou troca) o link secreto do telão. Trocar invalida o link anterior. Só em planos com telão.
export async function gerarLinkTelao(slug: string) {
  const { album, situacao } = await albumComPlano(slug);
  if (!situacao.plano.telao) return;
  const telaoToken = randomBytes(18).toString("base64url"); // 24 caracteres
  await albums.updateOne({ _id: album._id }, { $set: { telaoToken } });
  revalidatePath(`/dashboard/a/${slug}`, "layout");
}

// Ocultar/mostrar uma foto no telão (campo "aprovado" do envio).
export async function definirVisivelNoTelao(slug: string, driveFileId: string, visivel: boolean) {
  const album = await albums.findOne({ slug, ownerId: await donoId() }, { projection: { _id: 1 } });
  if (!album) return;
  await uploads.updateOne({ albumId: album._id, driveFileId }, { $set: { aprovado: visivel } });
  revalidatePath(`/dashboard/a/${slug}/envios`);
}

// Apaga uma mensagem do livro de visitas (o áudio, se houver, continua na pasta do Drive).
export async function excluirMensagem(slug: string, mensagemId: string) {
  const album = await albums.findOne({ slug, ownerId: await donoId() }, { projection: { _id: 1 } });
  if (!album || !ObjectId.isValid(mensagemId)) return;
  await mensagens.deleteOne({ _id: new ObjectId(mensagemId), albumId: album._id });
  revalidatePath(`/dashboard/a/${slug}/mensagens`);
}

export async function salvarCor(slug: string, cor: string) {
  if (!CORES_TEMA.some((c) => c.hex === cor)) return;
  const { album, situacao } = await albumComPlano(slug);
  if (!situacao.plano.personalizacao) return;
  await albums.updateOne({ _id: album._id }, { $set: { corTema: cor } });
  revalidatePath(`/dashboard/a/${slug}`, "layout");
}

const TIPOS_CAPA = ["image/jpeg", "image/png", "image/webp"];
const MAX_CAPA_BYTES = 1.5 * 1024 * 1024; // o navegador já reduz a imagem antes de enviar

export async function enviarCapa(slug: string, form: FormData): Promise<EstadoForm> {
  const ownerId = await donoId();
  const arquivo = form.get("capa");
  if (!(arquivo instanceof File) || !TIPOS_CAPA.includes(arquivo.type)) return { erro: "Escolha uma imagem JPG, PNG ou WebP." };
  if (arquivo.size > MAX_CAPA_BYTES) return { erro: "Imagem muito grande. Tente outra foto." };

  const album = await albums.findOne({ slug, ownerId });
  if (!album) redirect("/dashboard");
  if (!(await situacaoDoAlbum(album)).plano.personalizacao) return { erro: "A foto de capa não está incluída no plano deste álbum." };

  try {
    const id = await enviarArquivoPequeno(ownerId.toString(), album.driveFolderId, "Capa do álbum (Enviaí)", arquivo);
    await albums.updateOne({ _id: album._id }, { $set: { capaDriveFileId: id } });
    if (album.capaDriveFileId) await apagarArquivo(ownerId.toString(), album.capaDriveFileId).catch(() => {});
  } catch (e) {
    if (e instanceof DriveDesconectado) return { erro: "Reconecte seu Google Drive no painel e tente de novo." };
    throw e;
  }

  revalidatePath(`/dashboard/a/${slug}`, "layout");
  revalidatePath(`/a/${slug}`);
  return {};
}

export async function removerCapa(slug: string) {
  const ownerId = await donoId();
  const album = await albums.findOneAndUpdate(
    { slug, ownerId },
    { $unset: { capaDriveFileId: 1 } },
    { projection: { capaDriveFileId: 1 } },
  );
  if (album?.capaDriveFileId) await apagarArquivo(ownerId.toString(), album.capaDriveFileId).catch(() => {});
  revalidatePath(`/dashboard/a/${slug}`, "layout");
  revalidatePath(`/a/${slug}`);
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

  revalidatePath(`/dashboard/a/${slug}`, "layout");
  redirect(`/dashboard/a/${slug}`);
}

// Apaga o álbum e os registros de envio. A pasta e os arquivos continuam no Drive do dono.
export async function excluirAlbum(slug: string) {
  const album = await albums.findOneAndDelete({ slug, ownerId: await donoId() }, { projection: { _id: 1 } });
  if (album) await uploads.deleteMany({ albumId: album._id });
  redirect("/dashboard");
}
