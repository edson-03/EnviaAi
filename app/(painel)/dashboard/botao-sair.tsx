"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function BotaoSair() {
  const router = useRouter();

  async function sair() {
    await authClient.signOut();
    router.push("/entrar");
  }

  return (
    <button onClick={sair} className="rounded-lg border px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900">
      Sair
    </button>
  );
}
