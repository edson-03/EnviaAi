import Link from "next/link";
import { headers } from "next/headers";
import { Logo } from "@/components/logo";
import { auth } from "@/lib/auth";
import { primeiroNome } from "@/lib/formatar";
import { BotaoSair } from "./dashboard/botao-sair";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  const usuario = session?.user;

  return (
    <div className="fundo-painel flex flex-col bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.10),transparent_60%)]">
      <header className="sticky top-0 z-10 border-b border-zinc-200/70 bg-white/80 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/80">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <Logo href="/dashboard" />
          {usuario && (
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full p-1 pr-3 transition hover:bg-zinc-100 dark:hover:bg-zinc-800">
                {usuario.image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- foto do Google, domínio externo
                  <img src={usuario.image} alt="" referrerPolicy="no-referrer" className="h-8 w-8 rounded-full" />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-sm font-semibold text-white">
                    {usuario.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="hidden text-sm font-medium sm:inline">{primeiroNome(usuario.name)}</span>
                <span className="text-xs text-zinc-400 transition group-open:rotate-180">▾</span>
              </summary>
              <div className="cartao absolute right-0 mt-2 w-64 overflow-hidden p-1 shadow-lg">
                <div className="px-3 py-2">
                  <p className="truncate text-sm font-medium">{usuario.name}</p>
                  <p className="truncate text-xs text-zinc-500">{usuario.email}</p>
                </div>
                <hr className="my-1 border-zinc-100 dark:border-zinc-800" />
                <Link href="/dashboard" className="block rounded-lg px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  Seus álbuns
                </Link>
                <Link href="/dashboard/conta" className="block rounded-lg px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  Sua conta
                </Link>
                <BotaoSair className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40" />
              </div>
            </details>
          )}
        </div>
      </header>
      {children}
    </div>
  );
}
