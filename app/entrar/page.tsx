import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { auth } from "@/lib/auth";
import { BotaoGoogle } from "./botao-google";

// Navegadores embutidos (Instagram, Facebook, WhatsApp, TikTok, LinkedIn, Android WebView)
// são bloqueados pelo Google no login.
const WEBVIEW = /Instagram|FBAN|FBAV|FB_IAB|WhatsApp|TikTok|musical_ly|LinkedInApp|Line\/|; wv\)/i;

export default async function EntrarPage() {
  const h = await headers();
  if (await auth.api.getSession({ headers: h })) redirect("/dashboard");

  const emWebview = WEBVIEW.test(h.get("user-agent") ?? "");

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

        {emWebview ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            O Google não permite login dentro deste aplicativo. Toque no menu (⋮ ou ···) e escolha{" "}
            <strong>Abrir no navegador</strong>.
          </div>
        ) : (
          <BotaoGoogle />
        )}
      </div>
    </main>
  );
}
