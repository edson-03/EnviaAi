import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { COR_PADRAO, corDoAlbum } from "@/lib/cores";
import { albums, db } from "@/lib/mongodb";
import { situacaoDoAlbum } from "@/lib/planos";
import { EnvioConvidado } from "./envio-convidado";
import { LivroDeVisitas } from "./livro-de-visitas";

export default async function AlbumPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ previa?: string }>;
}) {
  const [{ slug }, { previa }] = await Promise.all([params, searchParams]);
  const album = await albums.findOne(
    { slug },
    {
      projection: {
        titulo: 1, tipoEvento: 1, mensagemBoasVindas: 1, ownerId: 1, ativo: 1, suspenso: 1, corTema: 1, capaDriveFileId: 1,
        createdAt: 1, planoContratado: 1, planoExpiraEm: 1,
      },
    },
  );
  if (!album) notFound();

  const dono = await db.collection("user").findOne({ _id: album.ownerId }, { projection: { name: 1, suspenso: 1, plano: 1 } });
  // Cor e capa só nos planos com personalização; prazo do plano limita o recebimento.
  const { plano, prazoEncerrado } = await situacaoDoAlbum(album, (dono?.plano as string | undefined) ?? null);
  const personalizado = plano.personalizacao;
  const cor = personalizado ? corDoAlbum(album.corTema) : COR_PADRAO;
  const recebendo = album.ativo && !prazoEncerrado;
  const capa = personalizado && album.capaDriveFileId ? `/api/capa/${slug}?v=${album.capaDriveFileId}` : null;

  // Prévia (botão "Ver prévia" do painel): só o dono; mostra a página completa com os envios desativados.
  let modoPrevia = false;
  if (previa === "1") {
    const session = await auth.api.getSession({ headers: await headers() });
    modoPrevia = session?.user.id === album.ownerId.toString();
  }

  // Suspenso pelo /admin (álbum ou dono): não mostra nada do evento.
  if (album.suspenso || dono?.suspenso) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <p className="text-lg font-semibold">Álbum indisponível</p>
        <p className="mt-1 text-sm text-zinc-500">Este álbum não está disponível no momento.</p>
      </main>
    );
  }

  return (
    // --cor: cor escolhida pelo organizador; os tons saem dela com color-mix.
    // No computador a página vira um cartão centralizado (como no celular), sobre um fundo desfocado da capa.
    <div className="relative isolate flex-1 md:px-4 md:py-10" style={{ ["--cor" as string]: cor }}>
      <div aria-hidden className="fixed inset-0 -z-10 hidden overflow-hidden md:block">
        {capa ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- capa servida pela nossa rota a partir do Drive */}
            <img src={capa} alt="" className="h-full w-full scale-110 object-cover blur-2xl" />
            <div className="absolute inset-0 bg-black/55" />
          </>
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,color-mix(in_srgb,var(--cor)_45%,transparent),transparent_55%),linear-gradient(160deg,color-mix(in_srgb,var(--cor)_25%,var(--background)),var(--background))]" />
        )}
      </div>

      <div className="relative mx-auto w-full bg-background md:max-w-lg md:overflow-hidden md:rounded-3xl md:shadow-2xl md:ring-1 md:ring-white/10">
      {modoPrevia && (
        <p className="sticky top-0 z-20 bg-amber-400 md:rounded-t-3xl px-4 py-2 text-center text-xs font-semibold text-amber-950">
          Prévia da página dos convidados · os envios estão desativados
          {!recebendo && " · o álbum não está recebendo agora: os convidados veem um aviso de indisponível"}
        </p>
      )}

      {/* Topo: capa como fundo (ou degradê na cor do evento) com o nome do evento por cima */}
      <header className={`relative isolate flex flex-col justify-end overflow-hidden ${capa ? "min-h-[360px] md:min-h-[400px]" : "min-h-[300px]"}`}>
        {capa ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- capa servida pela nossa rota a partir do Drive */}
            <img src={capa} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />
            <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-black/10 via-black/35 to-black/75" />
          </>
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,color-mix(in_srgb,var(--cor)_70%,white),transparent_45%),linear-gradient(135deg,var(--cor),color-mix(in_srgb,var(--cor)_55%,black))]"
          />
        )}
        {/* Transição suave do topo para o fundo da página */}
        <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-b from-transparent to-background" />
        <div className="mx-auto w-full max-w-lg px-5 pb-20 pt-14 text-center text-white">
          {album.tipoEvento && (
            <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur">
              {album.tipoEvento}
            </span>
          )}
          <h1 className="mt-3 text-4xl font-bold tracking-tight drop-shadow-sm">{album.titulo}</h1>
          <p className="mx-auto mt-3 max-w-md whitespace-pre-line text-base text-white/90 drop-shadow-sm">
            {album.mensagemBoasVindas ?? "Compartilhe suas fotos e vídeos deste momento."}
          </p>
        </div>
      </header>

      <main className="relative mx-auto -mt-12 w-full max-w-lg px-4 pb-12">
        {recebendo || modoPrevia ? (
          <>
            <EnvioConvidado slug={slug} previa={modoPrevia} />
            <p className="mt-4 text-center text-xs text-zinc-500">
              Sem aplicativo e sem cadastro · os arquivos vão direto para o Google Drive de{" "}
              {dono?.name ?? "quem organizou o evento"}
            </p>
            <LivroDeVisitas slug={slug} previa={modoPrevia} />
          </>
        ) : (
          <div className="cartao p-6 text-center shadow-xl">
            <p className="font-semibold">Este álbum não está recebendo arquivos no momento</p>
            <p className="mt-1 text-sm text-zinc-500">Fale com quem organizou o evento.</p>
          </div>
        )}

        <footer className="mt-12 space-y-3 text-center text-xs text-zinc-500">
          <p>
            Os arquivos enviados vão para o Google Drive de {dono?.name ?? "quem organizou o evento"}, responsável por eles.
          </p>
          <p>
            Feito com{" "}
            <Link href="/" className="font-semibold text-zinc-700 hover:text-violet-600 dark:text-zinc-300">
              Envia<span className="text-violet-600">í</span>
            </Link>
            {" · "}
            <Link href="/privacidade" className="hover:text-violet-600">
              Privacidade
            </Link>
            {" · "}
            <Link href="/termos" className="hover:text-violet-600">
              Termos
            </Link>
          </p>
        </footer>
      </main>
      </div>
    </div>
  );
}
