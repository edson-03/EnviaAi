"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

// linkSocial (e não signIn) porque só ele atualiza o escopo gravado na conta.
export function BotaoReconectar() {
  const [carregando, setCarregando] = useState(false);

  async function reconectar() {
    setCarregando(true);
    const { error } = await authClient.linkSocial({
      provider: "google",
      scopes: ["https://www.googleapis.com/auth/drive.file"],
      callbackURL: "/dashboard",
    });
    if (error) setCarregando(false);
  }

  return (
    <button
      onClick={reconectar}
      disabled={carregando}
      className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-60"
    >
      {carregando ? "Abrindo o Google..." : "Reconectar Drive"}
    </button>
  );
}
