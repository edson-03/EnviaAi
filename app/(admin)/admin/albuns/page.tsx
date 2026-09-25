import { ObjectId } from "mongodb";
import { exigirAdmin } from "@/lib/admin";
import { albums, db, uploads } from "@/lib/mongodb";
import { definirSuspensaoAlbum } from "../actions";
import { Busca, regexBusca } from "../busca";

const LIMITE = 100;

export default async function AdminAlbuns({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await exigirAdmin();
  const { q = "" } = await searchParams;
  const filtro = q.trim() ? { $or: [{ titulo: regexBusca(q.trim()) }, { slug: regexBusca(q.trim()) }] } : {};

  const lista = await albums
    .find(filtro, { projection: { titulo: 1, slug: 1, ownerId: 1, ativo: 1, suspenso: 1, createdAt: 1, tipoEvento: 1 } })
    .sort({ createdAt: -1 })
    .limit(LIMITE)
    .toArray();

  const [donos, contagem] = await Promise.all([
    db
      .collection("user")
      .find({ _id: { $in: [...new Set(lista.map((a) => a.ownerId.toString()))].map((id) => new ObjectId(id)) } }, { projection: { email: 1 } })
      .toArray(),
    uploads
      .aggregate<{ _id: ObjectId; total: number }>([
        { $match: { albumId: { $in: lista.map((a) => a._id) } } },
        { $group: { _id: "$albumId", total: { $sum: 1 } } },
      ])
      .toArray(),
  ]);
  const emailDono = new Map(donos.map((d) => [d._id.toString(), d.email as string]));
  const envios = new Map(contagem.map((c) => [c._id.toString(), c.total]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Álbuns</h1>
        <p className="mt-1 text-sm text-zinc-500">Os {LIMITE} álbuns mais recentes{q && " que batem com a busca"}.</p>
      </div>
      <Busca placeholder="Título ou endereço" valor={q} />

      <div className="cartao overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
            <tr>
              <th className="px-4 py-3 font-medium">Álbum</th>
              <th className="px-4 py-3 font-medium">Dono</th>
              <th className="px-4 py-3 font-medium">Criado</th>
              <th className="px-4 py-3 font-medium">Envios</th>
              <th className="px-4 py-3 font-medium">Situação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {lista.map((a) => {
              const id = a._id.toString();
              return (
                <tr key={id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{a.titulo}</p>
                    <a href={`/a/${a.slug}`} target="_blank" rel="noreferrer" className="text-xs text-zinc-500 hover:text-violet-600">
                      /a/{a.slug} ↗
                    </a>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{emailDono.get(a.ownerId.toString()) ?? "-"}</td>
                  <td className="px-4 py-3 text-zinc-500">
                    {a.createdAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                  </td>
                  <td className="px-4 py-3">{(envios.get(id) ?? 0).toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3">
                    <form action={definirSuspensaoAlbum.bind(null, id, !a.suspenso)} className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium ${a.suspenso ? "text-red-600" : a.ativo ? "text-green-600" : "text-amber-600"}`}
                      >
                        {a.suspenso ? "Suspenso" : a.ativo ? "Recebendo" : "Pausado"}
                      </span>
                      <button className={`text-xs font-medium hover:underline ${a.suspenso ? "text-green-700" : "text-red-600"}`}>
                        {a.suspenso ? "Liberar" : "Suspender"}
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {lista.length === 0 && <p className="px-4 py-10 text-center text-sm text-zinc-500">Nenhum álbum encontrado.</p>}
      </div>
    </div>
  );
}
