import Link from "next/link";

export function BotaoVoltar({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex max-w-full items-center gap-2 rounded-full border border-zinc-200 bg-white py-1.5 pl-1.5 pr-4 text-sm font-medium text-zinc-600 shadow-sm transition hover:border-violet-300 hover:text-violet-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-violet-700 dark:hover:text-violet-300"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 transition group-hover:-translate-x-0.5 group-hover:bg-violet-100 dark:bg-zinc-800 dark:group-hover:bg-violet-950">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="truncate">{children}</span>
    </Link>
  );
}
