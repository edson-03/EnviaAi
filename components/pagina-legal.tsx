import Link from "next/link";
import { Logo } from "./logo";

export const RESPONSAVEL = "Edson Mauro Morais Silva";
export const EMAIL_CONTATO = "edsonsilvat03@gmail.com";

export function PaginaLegal({
  titulo,
  atualizadoEm,
  children,
}: {
  titulo: string;
  atualizadoEm: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
          <Logo />
          <Link href="/entrar" className="text-sm font-medium text-zinc-600 hover:text-violet-600 dark:text-zinc-300">
            Entrar
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">{titulo}</h1>
        <p className="mt-2 text-sm text-zinc-500">Última atualização: {atualizadoEm}</p>
        <article className="cartao mt-8 space-y-4 p-6 leading-relaxed text-zinc-700 sm:p-8 dark:text-zinc-300 [&_a]:text-violet-600 [&_a]:underline [&_h2]:pt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-zinc-900 dark:[&_h2]:text-zinc-100 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1">
          {children}
        </article>
        <p className="mt-6 text-center text-sm text-zinc-500">
          <Link href="/privacidade" className="hover:text-violet-600">
            Privacidade
          </Link>
          {" · "}
          <Link href="/termos" className="hover:text-violet-600">
            Termos de uso
          </Link>
        </p>
      </main>
    </div>
  );
}
