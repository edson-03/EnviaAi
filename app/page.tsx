import Link from "next/link";
import { Logo } from "@/components/logo";

const PASSOS = [
  {
    titulo: "Crie o álbum",
    texto: "Entre com sua conta Google e dê um nome ao evento. Criamos uma pasta no seu Drive para receber tudo.",
  },
  {
    titulo: "Compartilhe o QR code",
    texto: "Imprima o QR code nas mesas ou envie o link no grupo do WhatsApp. Pronto para usar na hora.",
  },
  {
    titulo: "Receba as fotos",
    texto: "Os convidados escolhem as fotos e vídeos no celular e eles chegam direto no seu Drive, em qualidade original.",
  },
];

const BENEFICIOS = [
  { titulo: "Sem app e sem cadastro", texto: "O convidado abre o link no navegador e envia. Nada para instalar." },
  { titulo: "Qualidade original", texto: "Nada de foto comprimida pelo WhatsApp. O arquivo chega do jeito que saiu da câmera." },
  { titulo: "Vídeos grandes", texto: "Arquivos de até 4 GB. Se a internet cair, o envio continua de onde parou." },
  { titulo: "Tudo no seu Drive", texto: "As fotos ficam na sua conta Google, organizadas em uma pasta por evento." },
  { titulo: "Acesso mínimo", texto: "O Enviaí só enxerga as pastas que ele mesmo criou. O resto do seu Drive fica fechado." },
  { titulo: "Quem enviou o quê", texto: "O convidado pode deixar o nome, e você vê no painel quem mandou cada arquivo." },
];

const EVENTOS = ["Casamentos", "15 anos", "Formaturas", "Aniversários", "Chás de bebê", "Eventos corporativos"];

const PERGUNTAS = [
  {
    p: "O convidado precisa baixar algum aplicativo?",
    r: "Não. Ele escaneia o QR code ou abre o link, escolhe as fotos e vídeos e envia pelo navegador do celular. Também não precisa criar conta.",
  },
  {
    p: "Onde ficam as fotos?",
    r: "Numa pasta do seu próprio Google Drive, criada quando você cria o álbum. Você pode abrir, baixar ou compartilhar como quiser.",
  },
  {
    p: "O Enviaí tem acesso a todo o meu Drive?",
    r: "Não. Pedimos a permissão mais restrita do Google, que só dá acesso às pastas e arquivos criados pelo Enviaí.",
  },
  {
    p: "Tem limite de fotos?",
    r: "Cada arquivo pode ter até 4 GB e cada álbum recebe até 5.000 arquivos. O espaço usado é o do seu Google Drive, e o painel mostra quanto ainda está livre.",
  },
  {
    p: "E se a internet do convidado cair no meio do envio?",
    r: "O envio é retomado de onde parou quando a conexão volta. Se não der, o convidado vê um botão para tentar de novo.",
  },
];

function BotaoPrincipal({ children }: { children: React.ReactNode }) {
  return (
    <Link
      href="/entrar"
      className="inline-block rounded-lg bg-violet-600 px-6 py-3 font-medium text-white shadow-sm hover:bg-violet-700"
    >
      {children}
    </Link>
  );
}

// Ilustração do celular do convidado enviando fotos.
function CelularExemplo() {
  const arquivos = [
    { nome: "IMG_2041.jpg", pct: 100 },
    { nome: "IMG_2042.jpg", pct: 100 },
    { nome: "VID_0310.mp4", pct: 64 },
    { nome: "IMG_2045.jpg", pct: 28 },
  ];
  return (
    <div className="mx-auto w-64 rounded-[2.5rem] border-8 border-zinc-900 bg-white p-4 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
      <p className="text-center text-sm font-bold text-zinc-900 dark:text-zinc-100">Casamento Ana e Léo</p>
      <p className="mt-1 text-center text-xs text-zinc-500">Envie suas fotos e vídeos</p>
      <div className="mt-4 rounded-lg bg-violet-600 py-2 text-center text-xs font-medium text-white">
        Escolher fotos e vídeos
      </div>
      <ul className="mt-4 space-y-3">
        {arquivos.map((a) => (
          <li key={a.nome} className="text-[11px] text-zinc-700 dark:text-zinc-300">
            <div className="flex justify-between">
              <span>{a.nome}</span>
              <span>{a.pct === 100 ? "Enviado" : `${a.pct}%`}</span>
            </div>
            <div className="mt-1 h-1.5 rounded bg-zinc-200 dark:bg-zinc-700">
              <div
                className={`h-1.5 rounded ${a.pct === 100 ? "bg-green-500" : "bg-violet-600"}`}
                style={{ width: `${a.pct}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col font-sans">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <Logo />
        <Link href="/entrar" className="text-sm font-medium text-zinc-700 hover:text-violet-600 dark:text-zinc-300">
          Entrar
        </Link>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-5xl items-center gap-12 px-4 py-12 md:grid-cols-2 md:py-20">
          <div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Todas as fotos do seu evento, <span className="text-violet-600">num só lugar</span>
            </h1>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
              Os convidados escaneiam um QR code e enviam fotos e vídeos direto para o seu Google Drive. Sem
              aplicativo, sem cadastro e em qualidade original.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <BotaoPrincipal>Criar meu álbum</BotaoPrincipal>
              <a href="#como-funciona" className="font-medium text-zinc-700 hover:text-violet-600 dark:text-zinc-300">
                Como funciona ↓
              </a>
            </div>
          </div>
          <CelularExemplo />
        </section>

        <section id="como-funciona" className="bg-zinc-50 py-16 dark:bg-zinc-900/50">
          <div className="mx-auto w-full max-w-5xl px-4">
            <h2 className="text-center text-3xl font-bold tracking-tight">Como funciona</h2>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {PASSOS.map((passo, i) => (
                <li key={passo.titulo} className="rounded-xl border bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{passo.titulo}</h3>
                  <p className="mt-2 text-zinc-600 dark:text-zinc-400">{passo.texto}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-4 py-16">
          <h2 className="text-center text-3xl font-bold tracking-tight">Feito para o dia do evento</h2>
          <div className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2 md:grid-cols-3">
            {BENEFICIOS.map((b) => (
              <div key={b.titulo}>
                <h3 className="font-semibold">
                  <span className="mr-2 text-violet-600">✓</span>
                  {b.titulo}
                </h3>
                <p className="mt-1 text-zinc-600 dark:text-zinc-400">{b.texto}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-zinc-50 py-16 dark:bg-zinc-900/50">
          <div className="mx-auto w-full max-w-5xl px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Para qualquer celebração</h2>
            <ul className="mt-8 flex flex-wrap justify-center gap-3">
              {EVENTOS.map((e) => (
                <li
                  key={e}
                  className="rounded-full border bg-white px-4 py-2 text-sm font-medium dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {e}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl px-4 py-16">
          <h2 className="text-center text-3xl font-bold tracking-tight">Perguntas frequentes</h2>
          <div className="mt-8 divide-y rounded-xl border dark:divide-zinc-800 dark:border-zinc-800">
            {PERGUNTAS.map((q) => (
              <details key={q.p} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {q.p}
                  <span className="text-violet-600 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-zinc-600 dark:text-zinc-400">{q.r}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="px-4 pb-20">
          <div className="mx-auto max-w-3xl rounded-2xl bg-violet-600 px-6 py-12 text-center text-white">
            <h2 className="text-3xl font-bold tracking-tight">Seu próximo evento merece todas as fotos</h2>
            <p className="mt-3 text-violet-100">Crie o álbum em menos de um minuto com sua conta Google.</p>
            <Link
              href="/entrar"
              className="mt-8 inline-block rounded-lg bg-white px-6 py-3 font-medium text-violet-700 hover:bg-violet-50"
            >
              Criar meu álbum
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-zinc-500 dark:border-zinc-800">
        © {new Date().getFullYear()} Enviaí ·{" "}
        <Link href="/privacidade" className="hover:text-violet-600">
          Privacidade
        </Link>{" "}
        ·{" "}
        <Link href="/termos" className="hover:text-violet-600">
          Termos de uso
        </Link>
      </footer>
    </div>
  );
}
