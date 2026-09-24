import { headers } from "next/headers";
import { redirect } from "next/navigation";
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
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <div>
        <h1 className="text-3xl font-bold">Entrar no Enviaí</h1>
        <p className="mt-2 max-w-sm text-zinc-600 dark:text-zinc-400">
          Use sua conta Google. Vamos pedir acesso apenas às pastas e arquivos que o Enviaí
          criar no seu Drive.
        </p>
      </div>

      {emWebview ? (
        <div className="max-w-sm rounded-lg border border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
          O Google não permite login dentro deste aplicativo. Toque no menu (⋮ ou ···) e
          escolha <strong>Abrir no navegador</strong>.
        </div>
      ) : (
        <BotaoGoogle />
      )}
    </main>
  );
}
