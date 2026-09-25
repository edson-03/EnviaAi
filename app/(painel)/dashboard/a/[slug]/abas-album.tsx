"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ABAS = [
  { caminho: "", rotulo: "Visão geral" },
  { caminho: "/envios", rotulo: "Envios" },
  { caminho: "/compartilhar", rotulo: "Compartilhar" },
  { caminho: "/personalizar", rotulo: "Personalizar" },
  { caminho: "/configuracoes", rotulo: "Configurações" },
];

export function AbasAlbum({ slug }: { slug: string }) {
  const atual = usePathname();
  const base = `/dashboard/a/${slug}`;

  return (
    <nav className="-mx-4 mt-6 overflow-x-auto border-b border-zinc-200 px-4 dark:border-zinc-800">
      <ul className="flex min-w-max gap-1">
        {ABAS.map((aba) => {
          const href = base + aba.caminho;
          // "Compartilhar" continua ativa na página da placa.
          const ativa = aba.caminho === "" ? atual === base : atual.startsWith(href) || (aba.caminho === "/compartilhar" && atual.startsWith(`${base}/placa`));
          return (
            <li key={aba.rotulo}>
              <Link
                href={href}
                className={`-mb-px block border-b-2 px-3 py-2.5 text-sm font-medium transition ${
                  ativa
                    ? "border-violet-600 text-violet-700 dark:text-violet-300"
                    : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-800 dark:hover:border-zinc-700 dark:hover:text-zinc-200"
                }`}
              >
                {aba.rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
