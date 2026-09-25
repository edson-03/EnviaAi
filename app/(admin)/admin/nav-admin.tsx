"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITENS = [
  { href: "/admin", rotulo: "Visão geral" },
  { href: "/admin/usuarios", rotulo: "Usuários" },
  { href: "/admin/albuns", rotulo: "Álbuns" },
];

export function NavAdmin() {
  const atual = usePathname();
  return (
    <nav className="flex items-center gap-1">
      {ITENS.map((i) => {
        const ativo = i.href === "/admin" ? atual === "/admin" : atual.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              ativo ? "bg-white/15 text-white" : "text-zinc-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            {i.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
