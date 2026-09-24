import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { statusDrive } from "@/lib/google";
import { BotaoReconectar } from "./botao-reconectar";
import { BotaoSair } from "./botao-sair";

function formatarGB(bytes: number) {
  return `${(bytes / 1024 ** 3).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} GB`;
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/entrar");

  const drive = await statusDrive(session.user.id);

  return (
    <main className="mx-auto w-full max-w-3xl p-4">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Olá, {session.user.name}</h1>
          <p className="text-sm text-zinc-500">{session.user.email}</p>
        </div>
        <BotaoSair />
      </header>

      <section className="mt-6 flex items-center justify-between gap-4 rounded-lg border p-4">
        {drive.conectado ? (
          <p className="text-sm">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-500" />
            Google Drive conectado
            {drive.livreBytes !== null && <> · {formatarGB(drive.livreBytes)} livres</>}
          </p>
        ) : (
          <>
            <p className="text-sm">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-amber-500" />
              Perdemos o acesso ao seu Google Drive. Reconecte para receber as fotos.
            </p>
            <BotaoReconectar />
          </>
        )}
      </section>
    </main>
  );
}
