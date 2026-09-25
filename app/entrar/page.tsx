import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { auth } from "@/lib/auth";
import { BotaoGoogle } from "./botao-google";

// Navegadores embutidos (Instagram, Facebook, WhatsApp, TikTok, LinkedIn, Android WebView)
// são bloqueados pelo Google no login.
const WEBVIEW = /Instagram|FBAN|FBAV|FB_IAB|WhatsApp|TikTok|musical_ly|LinkedInApp|Line\/|; wv\)/i;

export default async function EntrarPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const h = await headers();
  if (await auth.api.getSession({ headers: h })) redirect("/dashboard");

  const emWebview = WEBVIEW.test(h.get("user-agent") ?? "");
  // Better Auth devolve erros de login como /entrar?error=CODIGO (ver onAPIError em lib/auth.ts).
  const { error } = await searchParams;
  const erroLogin = !error
    ? undefined
    : /suspens/i.test(error)
      ? "Sua conta está suspensa. Fale com o suporte pelo e-mail edsonsilvat03@gmail.com."
      : "Não foi possível entrar. Tente de novo.";

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-violet-100 to-white px-4 py-12 dark:from-violet-950/50 dark:to-zinc-950">
      <Logo />
      <div className="cartao mt-6 flex w-full max-w-sm flex-col items-center gap-6 p-8 text-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Entrar</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Use sua conta Google. Vamos pedir acesso apenas às pastas e arquivos que o Enviaí criar no seu
            Drive.
          </p>
        </div>

        {erroLogin && (
          <p className="w-full rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
            {erroLogin}
          </p>
        )}

        {emWebview ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            O Google não permite login dentro deste aplicativo. Toque no menu (⋮ ou ···) e escolha{" "}
            <strong>Abrir no navegador</strong>.
          </div>
        ) : (
          <BotaoGoogle />
        )}
        <p className="text-xs text-zinc-500">
          Ao entrar, você concorda com os{" "}
          <Link href="/termos" className="underline hover:text-violet-600">
            Termos de uso
          </Link>{" "}
          e a{" "}
          <Link href="/privacidade" className="underline hover:text-violet-600">
            Política de Privacidade
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
