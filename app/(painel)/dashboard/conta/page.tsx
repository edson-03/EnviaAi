import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BotaoVoltar } from "@/components/botao-voltar";
import { auth } from "@/lib/auth";
import { FormExcluir } from "./form-excluir";

export default async function ContaPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/entrar");

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-8">
      <BotaoVoltar href="/dashboard">Seus álbuns</BotaoVoltar>

      <div className="cartao mt-4 p-6">
        <h1 className="text-2xl font-bold tracking-tight">Sua conta</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {session.user.name} · {session.user.email}
        </p>
      </div>

      <div className="cartao mt-4 border-red-200 p-6 dark:border-red-900">
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">Excluir minha conta</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Isto não pode ser desfeito. Vamos:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
          <li>apagar todos os seus álbuns e a lista de envios;</li>
          <li>desativar os links e QR codes dos álbuns;</li>
          <li>remover o acesso do Enviaí ao seu Google Drive.</li>
        </ul>
        <p className="mt-3 text-sm font-medium">
          As pastas e todos os arquivos continuam no seu Google Drive.
        </p>
        <FormExcluir />
      </div>
    </main>
  );
}
