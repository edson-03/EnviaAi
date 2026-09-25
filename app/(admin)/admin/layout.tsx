import type { Metadata } from "next";
import Link from "next/link";
import { exigirAdmin } from "@/lib/admin";
import { NavAdmin } from "./nav-admin";

export const metadata: Metadata = { title: "Administração · Enviaí", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await exigirAdmin();

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Barra escura: deixa claro que é a área de administração, não o painel do organizador. */}
      <header className="sticky top-0 z-10 bg-zinc-900 text-white">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold tracking-tight">
              Envia<span className="text-violet-400">í</span>{" "}
              <span className="rounded bg-violet-600 px-1.5 py-0.5 text-xs font-semibold uppercase">Admin</span>
            </span>
            <NavAdmin />
          </div>
          <Link href="/dashboard" className="text-sm text-zinc-300 hover:text-white">
            Voltar ao painel →
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
