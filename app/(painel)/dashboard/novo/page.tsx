import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BotaoVoltar } from "@/components/botao-voltar";
import { auth } from "@/lib/auth";
import { FormAlbum } from "./form-album";

export default async function NovoAlbumPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/entrar");

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-8">
      <BotaoVoltar href="/dashboard">Seus álbuns</BotaoVoltar>
      <div className="cartao mt-4 p-6">
        <h1 className="text-2xl font-bold tracking-tight">Novo álbum</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Vamos criar uma pasta no seu Google Drive para receber as fotos e vídeos.
        </p>
        <FormAlbum />
      </div>
    </main>
  );
}
