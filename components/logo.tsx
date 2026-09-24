import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="text-xl font-bold tracking-tight">
      Envia<span className="text-violet-600">í</span>
    </Link>
  );
}
