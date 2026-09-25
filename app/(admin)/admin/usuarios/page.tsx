import { ObjectId } from "mongodb";
import { exigirAdmin } from "@/lib/admin";
import { albums, db } from "@/lib/mongodb";
import { definirPlano, definirSuspensaoUsuario } from "../actions";
import { Busca, regexBusca } from "../busca";

const LIMITE = 100;

type Usuario = { _id: ObjectId; name: string; email: string; plano?: string; suspenso?: boolean; createdAt?: Date };

export default async function AdminUsuarios({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const admin = await exigirAdmin();
  const { q = "" } = await searchParams;
  const filtro = q.trim() ? { $or: [{ name: regexBusca(q.trim()) }, { email: regexBusca(q.trim()) }] } : {};

  const lista = await db
    .collection<Usuario>("user")
    .find(filtro, { projection: { name: 1, email: 1, plano: 1, suspenso: 1, createdAt: 1 } })
    .sort({ createdAt: -1 })
    .limit(LIMITE)
    .toArray();

  const contagem = await albums
    .aggregate<{ _id: ObjectId; total: number }>([
      { $match: { ownerId: { $in: lista.map((u) => u._id) } } },
      { $group: { _id: "$ownerId", total: { $sum: 1 } } },
    ])
    .toArray();
  const albunsPorUsuario = new Map(contagem.map((c) => [c._id.toString(), c.total]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
        <p className="mt-1 text-sm text-zinc-500">Os {LIMITE} cadastros mais recentes{q && " que batem com a busca"}.</p>
      </div>
      <Busca placeholder="Nome ou e-mail" valor={q} />

      <div className="cartao overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
            <tr>
              <th className="px-4 py-3 font-medium">Usuário</th>
              <th className="px-4 py-3 font-medium">Cadastro</th>
              <th className="px-4 py-3 font-medium">Álbuns</th>
              <th className="px-4 py-3 font-medium">Plano</th>
              <th className="px-4 py-3 font-medium">Situação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {lista.map((u) => {
              const id = u._id.toString();
              const plano = u.plano ?? "free";
              const euMesmo = id === admin.user.id;
              return (
                <tr key={id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{u.name}</p>
                    <p className="text-xs text-zinc-500">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "-"}
                  </td>
                  <td className="px-4 py-3">{albunsPorUsuario.get(id) ?? 0}</td>
                  <td className="px-4 py-3">
                    <form action={definirPlano.bind(null, id, plano === "premium" ? "free" : "premium")} className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${
                          plano === "premium"
                            ? "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                        }`}
                      >
                        {plano}
                      </span>
                      <button className="text-xs font-medium text-violet-600 hover:underline">
                        {plano === "premium" ? "Voltar p/ free" : "Dar premium"}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    {euMesmo ? (
                      <span className="text-xs text-zinc-400">você</span>
                    ) : (
                      <form action={definirSuspensaoUsuario.bind(null, id, !u.suspenso)} className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${u.suspenso ? "text-red-600" : "text-green-600"}`}>
                          {u.suspenso ? "Suspenso" : "Ativo"}
                        </span>
                        <button className={`text-xs font-medium hover:underline ${u.suspenso ? "text-green-700" : "text-red-600"}`}>
                          {u.suspenso ? "Reativar" : "Suspender"}
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {lista.length === 0 && <p className="px-4 py-10 text-center text-sm text-zinc-500">Nenhum usuário encontrado.</p>}
      </div>
    </div>
  );
}
