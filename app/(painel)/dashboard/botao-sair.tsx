"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function BotaoSair({ className = "btn-secundario" }: { className?: string }) {
  const router = useRouter();

  async function sair() {
    await authClient.signOut();
    router.push("/entrar");
  }

  return (
    <button onClick={sair} className={className}>
      Sair
    </button>
  );
}
