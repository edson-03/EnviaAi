import Link from "next/link";

// Cartão que explica que o recurso é premium e leva à página de pagamento do álbum.
export function ConvitePremium({ slug, titulo, texto }: { slug: string; titulo: string; texto: string }) {
  return (
    <div className="cartao flex flex-wrap items-center justify-between gap-4 border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 dark:border-violet-900 dark:from-violet-950/40 dark:to-zinc-900">
      <div className="max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">Disponível nos planos pagos</p>
        <h2 className="mt-1 font-semibold">{titulo}</h2>
        <p className="mt-1 text-sm text-zinc-500">{texto}</p>
      </div>
      <Link href={`/dashboard/a/${slug}/premium`} className="btn-primario">
        Ver planos
      </Link>
    </div>
  );
}
