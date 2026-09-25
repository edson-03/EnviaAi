import Link from "next/link";
import { exigirAdmin } from "@/lib/admin";
import { formatarBytes } from "@/lib/formatar";
import { albums, db, uploads } from "@/lib/mongodb";

function Numero({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe?: string }) {
  return (
    <div className="cartao p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{rotulo}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight">{valor}</p>
      {detalhe && <p className="mt-1 text-xs text-zinc-500">{detalhe}</p>}
    </div>
  );
}

const n = (x: number) => x.toLocaleString("pt-BR");

function diasAtras(dias: number) {
  return new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
}

export default async function AdminVisaoGeral() {
  await exigirAdmin();
  const seteDias = diasAtras(7);
  const usuarios = db.collection("user");

  const [
    totalUsuarios,
    novosUsuarios,
    premium,
    suspensos,
    totalAlbuns,
    albunsAtivos,
    [somaUploads],
    uploads7d,
    recentes,
  ] = await Promise.all([
    usuarios.countDocuments(),
    usuarios.countDocuments({ createdAt: { $gte: seteDias } }),
    usuarios.countDocuments({ plano: "premium" }),
    usuarios.countDocuments({ suspenso: true }),
    albums.countDocuments(),
    albums.countDocuments({ ativo: true, suspenso: { $ne: true } }),
    uploads.aggregate<{ total: number; bytes: number }>([{ $group: { _id: null, total: { $sum: 1 }, bytes: { $sum: "$tamanhoBytes" } } }]).toArray(),
    uploads.countDocuments({ createdAt: { $gte: seteDias } }),
    usuarios.find({}, { projection: { name: 1, email: 1, createdAt: 1, plano: 1 } }).sort({ createdAt: -1 }).limit(8).toArray(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Visão geral</h1>
        <p className="mt-1 text-sm text-zinc-500">Números de todo o Enviaí.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Numero rotulo="Usuários" valor={n(totalUsuarios)} detalhe={`+${n(novosUsuarios)} nos últimos 7 dias`} />
        <Numero rotulo="Premium" valor={n(premium)} detalhe={suspensos ? `${n(suspensos)} conta(s) suspensa(s)` : "nenhuma conta suspensa"} />
        <Numero rotulo="Álbuns" valor={n(totalAlbuns)} detalhe={`${n(albunsAtivos)} recebendo arquivos`} />
        <Numero
          rotulo="Arquivos recebidos"
          valor={n(somaUploads?.total ?? 0)}
          detalhe={`${formatarBytes(somaUploads?.bytes ?? 0)} · +${n(uploads7d)} em 7 dias`}
        />
      </div>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Cadastros recentes</h2>
          <Link href="/admin/usuarios" className="text-sm font-medium text-violet-600 hover:text-violet-700">
            Ver todos →
          </Link>
        </div>
        <ul className="cartao mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
          {recentes.map((u) => (
            <li key={u._id.toString()} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{u.name}</p>
                <p className="truncate text-xs text-zinc-500">{u.email}</p>
              </div>
              <div className="shrink-0 text-right text-xs text-zinc-500">
                <p className="font-medium uppercase text-zinc-700 dark:text-zinc-300">{u.plano ?? "free"}</p>
                <p>{u.createdAt ? new Date(u.createdAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : ""}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
