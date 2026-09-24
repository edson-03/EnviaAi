import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { FormAlbum } from "./form-album";

export default async function NovoAlbumPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/entrar");

  return (
    <main className="mx-auto w-full max-w-md p-4">
      <Link href="/dashboard" className="text-sm text-zinc-500 hover:underline">
        ← Voltar
      </Link>
      <h1 className="mt-2 text-2xl font-bold">Novo álbum</h1>
      <p className="text-sm text-zinc-500">Vamos criar uma pasta no seu Google Drive para receber as fotos.</p>
      <FormAlbum />
    </main>
  );
}
