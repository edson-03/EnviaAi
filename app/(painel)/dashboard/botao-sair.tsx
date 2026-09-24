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
    <button onClick={sair} className="btn-secundario">
      Sair
    </button>
  );
}
