"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function BotaoGoogle() {
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    setCarregando(true);
    const { error } = await authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" });
    if (error) setCarregando(false);
  }

  return (
    <button
      onClick={entrar}
      disabled={carregando}
      className="rounded-lg bg-violet-600 px-6 py-3 font-medium text-white hover:bg-violet-700 disabled:opacity-60"
    >
      {carregando ? "Abrindo o Google..." : "Entrar com Google"}
    </button>
  );
}
