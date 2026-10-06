import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import { Logo } from "@/components/logo";
import { EMAIL_CONTATO } from "@/components/pagina-legal";
import {
  IconeAlbum,
  IconeCadeado,
  IconeCelular,
  IconeCheck,
  IconeDrive,
  IconeEmail,
  IconeImpressao,
  IconeMensagem,
  IconePainel,
  IconePasta,
  IconeQr,
  IconeQualidade,
  IconeRetomar,
  IconeSemApp,
  IconeSemLogin,
  IconeSeta,
  IconeTelao,
} from "@/components/landing/icones";
import { MockupCelular, MockupDrive, MockupNotificacaoDrive, MockupPainel, MockupQr } from "@/components/landing/mockups";
import { formatarPreco, formatarTamanho, planoGratis, planosAVenda } from "@/lib/planos";

// Planos e limites vêm do banco (editados em /admin/planos); a página é refeita a cada 5 minutos.
export const revalidate = 300;

const URL_SITE = process.env.NEXT_PUBLIC_APP_URL ?? "https://enviaai.site";
const TITULO = "Enviaí: receba as fotos dos convidados do seu evento por QR code";
const DESCRICAO =
  "Os convidados enviam fotos e vídeos do casamento, formatura ou festa pelo navegador, sem aplicativo e sem cadastro. Tudo chega direto no seu Google Drive.";

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRICAO,
  alternates: { canonical: "/" },
  openGraph: { title: TITULO, description: DESCRICAO, url: "/", siteName: "Enviaí", locale: "pt_BR", type: "website" },
  twitter: { card: "summary_large_image", title: TITULO, description: DESCRICAO },
};

// ---------- Conteúdo fixo ----------

const PROBLEMAS = [
  { titulo: "Perdidas nos grupos", texto: "As fotos chegam em vários grupos e conversas, misturadas com mensagens e figurinhas." },
  { titulo: "Qualidade reduzida", texto: "Fotos e vídeos enviados por aplicativos de mensagem costumam chegar comprimidos." },
  { titulo: "Um pedido para cada pessoa", texto: "Você precisa lembrar quem fotografou e pedir para cada convidado mandar." },
  { titulo: "Mais um app? Não.", texto: "No meio da festa, pedir cadastro ou download vira um obstáculo para quem quer ajudar." },
];

const PASSOS = [
  { icone: IconeAlbum, titulo: "Crie seu álbum", texto: "Entre com sua conta Google e dê um nome ao evento. Criamos uma pasta no seu Drive para ele." },
  { icone: IconeQr, titulo: "Compartilhe o QR code", texto: "Imprima a placa pronta para as mesas ou mande o link no grupo do evento." },
  { icone: IconeCelular, titulo: "Os convidados enviam", texto: "Abrem no navegador do celular, escolhem fotos e vídeos e enviam. Sem cadastro." },
  { icone: IconeDrive, titulo: "Tudo no seu Drive", texto: "Os arquivos chegam direto na pasta do álbum, e você acompanha tudo pelo painel." },
];

const BENEFICIOS = [
  { icone: IconeSemLogin, titulo: "Sem conta para os convidados", texto: "Quem tem o link já pode enviar. Nada de cadastro ou senha." },
  { icone: IconeSemApp, titulo: "Sem aplicativo", texto: "Funciona no navegador do celular, no Android e no iPhone." },
  { icone: IconeQualidade, titulo: "Qualidade original", texto: "O arquivo chega do jeito que saiu da câmera, sem compressão." },
  { icone: IconeRetomar, titulo: "Envio que não se perde", texto: "Se a internet cair, o envio continua de onde parou." },
  { icone: IconePainel, titulo: "Acompanhe pelo painel", texto: "Veja o que chegou, quem enviou e os recados deixados." },
  { icone: IconeMensagem, titulo: "Livro de visitas", texto: "Os convidados deixam mensagens escritas ou de voz." },
  { icone: IconeImpressao, titulo: "Placa para imprimir", texto: "Cartaz A4 ou cartões de mesa com o QR code do álbum." },
  { icone: IconeEmail, titulo: "Aviso por e-mail", texto: "Receba um resumo quando chegarem arquivos novos." },
];

const PAGOS = [
  { icone: IconeTelao, titulo: "Telão ao vivo", texto: "Mostre as fotos na TV ou no projetor enquanto elas chegam." },
  { icone: IconeAlbum, titulo: "Cor e foto de capa", texto: "Deixe a página dos convidados com a cara do evento." },
];

const EVENTOS = [
  { titulo: "Casamentos", texto: "Reúna os registros que seus convidados fizeram do grande dia, da cerimônia à pista.", tom: "from-rose-200 to-amber-100" },
  { titulo: "Formaturas", texto: "Receba os melhores momentos registrados por toda a turma, num só álbum.", tom: "from-sky-200 to-indigo-100" },
  { titulo: "15 anos", texto: "Deixe amigos e família contribuírem para o álbum da festa.", tom: "from-fuchsia-200 to-violet-100" },
  { titulo: "Eventos corporativos", texto: "Centralize os registros feitos pela equipe e pelos participantes.", tom: "from-emerald-200 to-teal-100" },
];

// ---------- Peças visuais ----------

function BotaoCriar({ children = "Criar meu álbum grátis" }: { children?: React.ReactNode }) {
  return (
    <Link
      href="/entrar"
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-700 motion-safe:hover:-translate-y-0.5"
    >
      {children}
      <IconeSeta className="h-4 w-4" />
    </Link>
  );
}

function Secao({
  id,
  titulo,
  subtitulo,
  children,
  fundo = false,
}: {
  id?: string;
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
  fundo?: boolean;
}) {
  return (
    <section id={id} className={`scroll-mt-20 py-20 sm:py-24 ${fundo ? "bg-zinc-50 dark:bg-zinc-900/40" : ""}`}>
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{titulo}</h2>
          {subtitulo && <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">{subtitulo}</p>}
        </div>
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}

// ---------- Página ----------

export default async function Home() {
  const [gratis, aVenda, qr] = await Promise.all([
    planoGratis(),
    planosAVenda(),
    QRCode.toDataURL(URL_SITE, { width: 300, margin: 1 }),
  ]);
  const n = (x: number) => x.toLocaleString("pt-BR");
  const menorPreco = aVenda.length ? Math.min(...aVenda.map((p) => p.precoCentavos)) : null;
  const maiorLimite = Math.max(gratis.limiteArquivos, ...aVenda.map((p) => p.limiteArquivos));
  const albunsGratis = gratis.albunsAtivos ?? 1;

  const perguntas = [
    {
      p: "Os convidados precisam criar uma conta?",
      r: "Não. Quem abre o link ou escaneia o QR code já pode enviar fotos e vídeos. Se quiser, o convidado informa o nome, mas não é obrigatório.",
    },
    {
      p: "É preciso instalar algum aplicativo?",
      r: "Não. Tudo funciona no navegador do celular, no Android e no iPhone.",
    },
    {
      p: "Onde ficam as fotos e vídeos?",
      r: "Numa pasta do seu próprio Google Drive, criada quando você cria o álbum. Os arquivos vão do celular do convidado direto para essa pasta, e você abre, baixa ou compartilha como quiser.",
    },
    {
      p: "Preciso ter Google Drive?",
      r: "Você precisa de uma conta Google, que já inclui o Google Drive. O login no Enviaí é feito com ela, e o espaço usado é o da sua conta.",
    },
    {
      p: "O Enviaí tem acesso a todo o meu Drive?",
      r: "Não. Pedimos a permissão mais restrita do Google Drive, que só dá acesso às pastas e arquivos criados pelo próprio Enviaí.",
    },
    {
      p: "Como os convidados acessam o álbum?",
      r: "Pelo QR code ou pelo link do álbum. Você pode imprimir a placa pronta, com o QR code, ou mandar o link no grupo do evento.",
    },
    {
      p: "Dá para enviar vídeos?",
      r: `Sim, fotos e vídeos. No plano grátis, cada arquivo pode ter até ${formatarTamanho(gratis.maxBytesArquivo)}; os planos pagos podem permitir arquivos maiores. Se a internet cair, o envio continua de onde parou.`,
    },
    {
      p: "Posso usar em casamento, formatura, 15 anos ou evento corporativo?",
      r: "Sim. O Enviaí serve para qualquer evento em que você queira reunir as fotos e vídeos feitos pelos convidados ou participantes.",
    },
    {
      p: "Existe plano gratuito?",
      r: `Sim. No plano grátis você tem ${n(albunsGratis)} ${albunsGratis === 1 ? "álbum recebendo" : "álbuns recebendo"} arquivos por vez, com até ${n(gratis.limiteArquivos)} arquivos por álbum.${
        aVenda.length ? ` Nos planos pagos, até ${n(maiorLimite)} arquivos por álbum.` : ""
      }`,
    },
    ...(menorPreco !== null
      ? [
          {
            p: "Quanto custam os planos pagos?",
            r: `A partir de ${formatarPreco(menorPreco)}, com pagamento único por evento e sem mensalidade. Você contrata dentro do álbum, por Pix, cartão ou boleto.`,
          },
        ]
      : []),
  ];

  // Dados estruturados: só informações reais (sem avaliações nem números de usuários).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Enviaí",
    url: URL_SITE,
    description: DESCRICAO,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    inLanguage: "pt-BR",
    offers: [gratis, ...aVenda].map((p) => ({
      "@type": "Offer",
      name: p.nome,
      price: (p.precoCentavos / 100).toFixed(2),
      priceCurrency: "BRL",
    })),
  };

  return (
    <div className="flex flex-1 flex-col font-sans">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-zinc-900 focus:shadow"
      >
        Pular para o conteúdo
      </a>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/60 bg-white/80 backdrop-blur dark:border-zinc-800/60 dark:bg-zinc-950/80">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Logo />
          <nav aria-label="Principal" className="hidden items-center gap-7 text-sm font-medium text-zinc-600 md:flex dark:text-zinc-300">
            <a href="#como-funciona" className="hover:text-violet-600">Como funciona</a>
            <a href="#para-quem" className="hover:text-violet-600">Para quem</a>
            <a href="#planos" className="hover:text-violet-600">Planos</a>
            <a href="#perguntas" className="hover:text-violet-600">Perguntas</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/entrar" className="px-2 py-2 text-sm font-medium text-zinc-700 hover:text-violet-600 dark:text-zinc-300">
              Entrar
            </Link>
            <Link href="/entrar" className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700">
              Criar álbum<span className="hidden sm:inline"> grátis</span>
            </Link>
          </div>
        </div>
      </header>

      <main id="conteudo" className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.18),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(236,72,153,0.10),transparent_50%)]" />
          <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 pb-20 pt-12 sm:pt-16 lg:grid-cols-[1.1fr_1fr] lg:pb-28">
            <div>
              <p className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 dark:border-violet-900 dark:bg-violet-950/50 dark:text-violet-300">
                Para casamentos, formaturas, 15 anos e eventos corporativos
              </p>
              <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                Todas as fotos dos seus convidados, <span className="text-violet-600">reunidas no seu Google Drive</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                Compartilhe um QR code. Os convidados enviam fotos e vídeos pelo navegador, sem baixar aplicativo e sem criar
                conta. Tudo chega numa pasta do seu Drive.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <BotaoCriar />
                <a
                  href="#como-funciona"
                  className="inline-flex items-center justify-center rounded-xl border border-zinc-300 px-6 py-3.5 font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
                >
                  Ver como funciona
                </a>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                {["Sem aplicativo", "Sem login para os convidados", "Fotos e vídeos em qualidade original"].map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <IconeCheck className="h-4 w-4 text-violet-600" />
                    {t}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-zinc-500">Grátis para começar. Você entra com sua conta Google.</p>
            </div>

            <div className="relative mx-auto w-full max-w-md">
              <MockupCelular />
              <div className="absolute -left-4 -bottom-4 hidden motion-safe:animate-[aparecer_0.8s_ease-out] sm:block lg:-left-24">
                <MockupQr qr={qr} />
              </div>
              <div className="absolute -right-4 top-4 hidden motion-safe:animate-[aparecer_1.2s_ease-out] sm:block lg:-right-20">
                <MockupNotificacaoDrive />
              </div>
            </div>
          </div>
        </section>

        {/* Problema */}
        <Secao
          fundo
          titulo="Depois da festa, as fotos ficam espalhadas"
          subtitulo="Cada convidado registra o evento do seu jeito. O difícil é juntar tudo depois."
        >
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PROBLEMAS.map((p, i) => (
              <li key={p.titulo} className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-600 dark:bg-rose-950 dark:text-rose-300">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-semibold">{p.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{p.texto}</p>
              </li>
            ))}
          </ul>
        </Secao>

        {/* Solução + Como funciona */}
        <Secao
          id="como-funciona"
          titulo="Com o Enviaí, todo mundo envia para o mesmo lugar"
          subtitulo="Um QR code, um álbum e todas as fotos e vídeos dos convidados na sua conta Google."
        >
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PASSOS.map((passo, i) => (
              <li key={passo.titulo} className="relative">
                <div className="h-full rounded-2xl border border-zinc-200 bg-white p-6 transition motion-safe:hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                      <passo.icone className="h-6 w-6" />
                    </span>
                    <span className="text-4xl font-bold text-zinc-100 dark:text-zinc-800">{i + 1}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{passo.titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{passo.texto}</p>
                </div>
                {i < PASSOS.length - 1 && (
                  <IconeSeta className="absolute -right-5 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-violet-300 lg:block" />
                )}
              </li>
            ))}
          </ol>
          <div className="mt-10 text-center">
            <BotaoCriar />
          </div>
        </Secao>

        {/* Prova de simplicidade */}
        <section className="bg-violet-600 py-20 text-white">
          <div className="mx-auto max-w-5xl px-4 text-center">
            <p className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              Sem aplicativo.
              <br />
              Sem login para os convidados.
              <br />
              <span className="text-violet-200">É só apontar a câmera e enviar.</span>
            </p>
            <ul className="mx-auto mt-12 grid max-w-3xl gap-6 text-left sm:grid-cols-3">
              {[
                { icone: IconeQr, t: "Escaneia o QR code", d: "Com a câmera do próprio celular." },
                { icone: IconeCelular, t: "Escolhe as fotos", d: "Da galeria, quantas quiser." },
                { icone: IconePasta, t: "Pronto", d: "Os arquivos chegam na pasta do álbum." },
              ].map((x) => (
                <li key={x.t} className="flex gap-3 rounded-2xl bg-white/10 p-4">
                  <x.icone className="h-6 w-6 shrink-0 text-violet-200" />
                  <div>
                    <p className="font-semibold">{x.t}</p>
                    <p className="text-sm text-violet-100">{x.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Produto */}
        <Secao
          titulo="Acompanhe tudo em um painel simples"
          subtitulo="Veja os arquivos que chegaram, quem enviou e as mensagens dos convidados. Os originais ficam na pasta do álbum, no seu Drive."
        >
          <div className="grid items-start gap-8 lg:grid-cols-[1.25fr_1fr]">
            <figure>
              <MockupPainel />
              <figcaption className="mt-3 text-center text-sm text-zinc-500">Painel do organizador</figcaption>
            </figure>
            <figure className="lg:mt-16">
              <MockupDrive />
              <figcaption className="mt-3 text-center text-sm text-zinc-500">Pasta do álbum no seu Google Drive</figcaption>
            </figure>
          </div>
        </Secao>

        {/* Benefícios */}
        <Secao fundo titulo="Feito para o dia do evento" subtitulo="Simples para os convidados, organizado para você.">
          <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFICIOS.map((b) => (
              <li key={b.titulo}>
                <b.icone className="h-7 w-7 text-violet-600" />
                <h3 className="mt-3 font-semibold">{b.titulo}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{b.texto}</p>
              </li>
            ))}
          </ul>
          <div className="mt-14 rounded-2xl border border-violet-200 bg-white p-6 sm:p-8 dark:border-violet-900 dark:bg-zinc-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">Nos planos pagos</p>
            <ul className="mt-4 grid gap-6 sm:grid-cols-2">
              {PAGOS.map((b) => (
                <li key={b.titulo} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                    <b.icone className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="font-semibold">{b.titulo}</h3>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{b.texto}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Secao>

        {/* Google Drive */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 lg:grid-cols-2">
            <div>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
                <IconeDrive className="h-6 w-6" />
              </span>
              <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">Seus arquivos ficam no seu próprio Google Drive</h2>
              <p className="mt-4 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                O Enviaí cria uma pasta para cada álbum na sua conta Google. Os arquivos dos convidados vão do celular direto
                para essa pasta, e você abre, baixa ou compartilha como já faz hoje.
              </p>
              <ul className="mt-8 space-y-5">
                {[
                  { icone: IconePasta, t: "Uma pasta por evento", d: "Criada automaticamente quando você cria o álbum." },
                  {
                    icone: IconeCadeado,
                    t: "Acesso só ao necessário",
                    d: "Usamos a permissão mais restrita do Google Drive: o Enviaí só enxerga as pastas e arquivos que ele mesmo criou.",
                  },
                  { icone: IconePainel, t: "Espaço da sua conta", d: "O painel mostra quanto espaço ainda está livre no seu Drive." },
                ].map((x) => (
                  <li key={x.t} className="flex gap-4">
                    <x.icone className="mt-0.5 h-6 w-6 shrink-0 text-violet-600" />
                    <div>
                      <p className="font-semibold">{x.t}</p>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{x.d}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <MockupDrive />
          </div>
        </section>

        {/* Casos de uso */}
        <Secao id="para-quem" fundo titulo="Para qualquer celebração" subtitulo="Onde houver convidados com celular, há fotos para reunir.">
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {EVENTOS.map((e) => (
              <li key={e.titulo} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                <div aria-hidden className={`h-24 bg-gradient-to-br ${e.tom}`} />
                <div className="p-6">
                  <h3 className="text-lg font-semibold">{e.titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{e.texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </Secao>

        {/* Planos */}
        <Secao id="planos" titulo="Planos e preços" subtitulo="Comece grátis. Pague só quando o evento pedir mais: uma vez por evento, sem mensalidade.">
          <div
            className={`mx-auto grid max-w-5xl gap-6 ${aVenda.length ? "md:grid-cols-2" : "max-w-md"} ${aVenda.length > 1 ? "lg:grid-cols-3" : ""}`}
          >
            {[gratis, ...aVenda].map((p) => {
              const pago = p.tipo === "pago";
              const itens: [boolean, string][] = [
                [true, `Até ${n(p.limiteArquivos)} arquivos por álbum`],
                [true, `Arquivos de até ${formatarTamanho(p.maxBytesArquivo)}`],
                ...(!pago
                  ? ([[true, `${n(albunsGratis)} ${albunsGratis === 1 ? "álbum recebendo" : "álbuns recebendo"} por vez`]] as [boolean, string][])
                  : []),
                [true, p.validadeDias ? `Recebe arquivos por ${p.validadeDias} dias` : "Recebe arquivos sem prazo"],
                [true, "Placa, recados, livro de visitas e resumo por e-mail"],
                [p.telao, "Telão ao vivo"],
                [p.personalizacao, "Cor do evento e foto de capa"],
              ];
              return (
                <div
                  key={p._id}
                  className={`flex flex-col rounded-2xl p-7 ${
                    pago
                      ? "border-2 border-violet-500 bg-white shadow-xl shadow-violet-600/10 dark:bg-zinc-900"
                      : "border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                  }`}
                >
                  <h3 className="text-lg font-bold">{p.nome}</h3>
                  <p className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-4xl font-bold tracking-tight">{pago ? formatarPreco(p.precoCentavos) : "R$ 0"}</span>
                    <span className="text-sm text-zinc-500">{pago ? "por evento" : "para sempre"}</span>
                  </p>
                  <ul className="mt-6 flex-1 space-y-3 text-sm">
                    {itens.map(([ok, texto]) => (
                      <li key={texto} className={`flex gap-2 ${ok ? "" : "text-zinc-400"}`}>
                        {ok ? (
                          <IconeCheck className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                        ) : (
                          <span className="w-4 shrink-0 text-center" aria-hidden>
                            —
                          </span>
                        )}
                        <span className={ok ? "" : "line-through"}>
                          {texto}
                          {!ok && <span className="sr-only"> (não incluído)</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/entrar"
                    className={`mt-8 rounded-xl px-4 py-3 text-center font-semibold transition ${
                      pago
                        ? "bg-violet-600 text-white hover:bg-violet-700"
                        : "border border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {pago ? "Começar agora" : "Começar grátis"}
                  </Link>
                  {pago && <p className="mt-2 text-center text-xs text-zinc-500">Você contrata dentro do álbum, depois de criá-lo.</p>}
                </div>
              );
            })}
          </div>
          <p className="mt-8 text-center text-sm text-zinc-500">
            Pagamento por Pix, cartão ou boleto. Arrependimento em até 7 dias, conforme os{" "}
            <Link href="/termos" className="underline hover:text-violet-600">
              Termos de uso
            </Link>
            .
          </p>
        </Secao>

        {/* FAQ */}
        <Secao id="perguntas" fundo titulo="Perguntas frequentes">
          <div className="mx-auto max-w-3xl divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {perguntas.map((q) => (
              <details key={q.p} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl p-5 font-medium hover:text-violet-700 dark:hover:text-violet-300">
                  {q.p}
                  <span aria-hidden className="text-xl text-violet-600 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="px-5 pb-5 leading-relaxed text-zinc-600 dark:text-zinc-400">{q.r}</p>
              </details>
            ))}
          </div>
        </Secao>

        {/* CTA final */}
        <section className="px-4 py-20 sm:py-24">
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-600 px-6 py-14 text-center text-white sm:px-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Seu próximo evento merece todas as fotos</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-violet-100">
              Crie o álbum com sua conta Google e compartilhe o QR code com os convidados. É grátis para começar.
            </p>
            <Link
              href="/entrar"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-4 font-semibold text-violet-700 shadow-lg transition hover:bg-violet-50 motion-safe:hover:-translate-y-0.5"
            >
              Criar meu álbum grátis
              <IconeSeta className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-3 max-w-sm text-sm text-zinc-500">
              Os convidados enviam fotos e vídeos do evento pelo QR code, direto para o seu Google Drive.
            </p>
          </div>
          <nav aria-label="Produto" className="text-sm">
            <p className="font-semibold">Produto</p>
            <ul className="mt-3 space-y-2 text-zinc-500">
              <li>
                <a href="#como-funciona" className="hover:text-violet-600">Como funciona</a>
              </li>
              <li>
                <a href="#planos" className="hover:text-violet-600">Planos</a>
              </li>
              <li>
                <a href="#perguntas" className="hover:text-violet-600">Perguntas frequentes</a>
              </li>
              <li>
                <Link href="/entrar" className="hover:text-violet-600">Entrar</Link>
              </li>
            </ul>
          </nav>
          <nav aria-label="Institucional" className="text-sm">
            <p className="font-semibold">Institucional</p>
            <ul className="mt-3 space-y-2 text-zinc-500">
              <li>
                <Link href="/privacidade" className="hover:text-violet-600">Privacidade</Link>
              </li>
              <li>
                <Link href="/termos" className="hover:text-violet-600">Termos de uso</Link>
              </li>
              <li>
                <a href={`mailto:${EMAIL_CONTATO}`} className="hover:text-violet-600">Contato</a>
              </li>
            </ul>
          </nav>
        </div>
        <p className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800">
          © {new Date().getFullYear()} Enviaí. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
