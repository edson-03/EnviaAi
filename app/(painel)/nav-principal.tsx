"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavPrincipal() {
  const caminho = usePathname();
  const emAlbuns = caminho === "/dashboard" || caminho.startsWith("/dashboard/a/");

  return (
    <nav className="flex items-center gap-1">
      <Link
        href="/dashboard"
        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
          emAlbuns
            ? "bg-violet-600/10 text-violet-700 dark:text-violet-300"
            : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        }`}
      >
        Álbuns
      </Link>
      <Link
        href="/dashboard/novo"
        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
          caminho === "/dashboard/novo"
            ? "bg-violet-600/10 text-violet-700 dark:text-violet-300"
            : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        }`}
      >
        <span className="sm:hidden">+ Novo</span>
        <span className="hidden sm:inline">+ Novo álbum</span>
      </Link>
    </nav>
  );
}
