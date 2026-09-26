import type { ObjectId } from "mongodb";
import { exigirAdmin } from "@/lib/admin";
import { modoMercadoPago } from "@/lib/mercadopago";
import { albums, db, pagamentos } from "@/lib/mongodb";
import { formatarPreco } from "@/lib/planos";
import { BotaoTestarMercadoPago } from "./botao-testar";

const LIMITE = 100;

const STATUS: Record<string, { rotulo: string; cor: string }> = {
  approved: { rotulo: "Aprovado", cor: "text-green-600" },
  pending: { rotulo: "Pendente", cor: "text-amber-600" },
  in_process: { rotulo: "Em análise", cor: "text-amber-600" },
  rejected: { rotulo: "Recusado", cor: "text-red-600" },
  cancelled: { rotulo: "Cancelado", cor: "text-zinc-500" },
  refunded: { rotulo: "Reembolsado", cor: "text-zinc-500" },
  charged_back: { rotulo: "Contestado", cor: "text-red-600" },
};

const METODO: Record<string, string> = {
  bank_transfer: "Pix",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  ticket: "Boleto",
  account_money: "Saldo MP",
};

function inicioDoMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default async function AdminPagamentos() {
  await exigirAdmin();
  const modo = modoMercadoPago();

  const [lista, [mes]] = await Promise.all([
    pagamentos.find().sort({ createdAt: -1 }).limit(LIMITE).toArray(),
    pagamentos
      .aggregate<{ total: number; qtd: number }>([
        { $match: { status: "approved", createdAt: { $gte: inicioDoMes() } } },
        { $group: { _id: null, total: { $sum: "$valorCentavos" }, qtd: { $sum: 1 } } },
      ])
      .toArray(),
  ]);

  const [albunsInfo, donos] = await Promise.all([
    albums.find({ _id: { $in: lista.map((p) => p.albumId) } }, { projection: { titulo: 1, slug: 1 } }).toArray(),
    db.collection("user").find({ _id: { $in: lista.map((p) => p.ownerId) } }, { projection: { email: 1 } }).toArray(),
  ]);
  const album = new Map(albunsInfo.map((a) => [a._id.toString(), a]));
  const email = new Map(donos.map((d) => [(d._id as ObjectId).toString(), d.email as string]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pagamentos</h1>
        <p className="mt-1 text-sm text-zinc-500">Vendas de planos pelo Mercado Pago.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="cartao p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Recebido no mês</p>
          <p className="mt-1 text-3xl font-bold tracking-tight">{formatarPreco(mes?.total ?? 0)}</p>
          <p className="mt-1 text-xs text-zinc-500">{mes?.qtd ?? 0} pagamento(s) aprovado(s)</p>
        </div>
        <div className="cartao p-5 md:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Mercado Pago</p>
          <p className="mt-1 flex items-center gap-2 text-lg font-bold">
            <span
              className={`h-2.5 w-2.5 rounded-full ${modo === "producao" ? "bg-green-500" : modo === "teste" ? "bg-amber-500" : "bg-red-500"}`}
            />
            {modo === "producao" ? "Produção (cobrando de verdade)" : modo === "teste" ? "Modo TESTE" : "Não configurado"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            A chave (MP_ACCESS_TOKEN) fica nas variáveis de ambiente da Vercel, nunca no banco. Para trocar: Vercel → Settings →
            Environment Variables → editar e fazer redeploy.
          </p>
          {modo !== "nao-configurado" && (
            <div className="mt-3">
              <BotaoTestarMercadoPago />
            </div>
          )}
        </div>
      </div>

      <div className="cartao overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
            <tr>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Álbum / cliente</th>
              <th className="px-4 py-3 font-medium">Plano</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Forma</th>
              <th className="px-4 py-3 font-medium">Situação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {lista.map((p) => {
              const a = album.get(p.albumId.toString());
              const s = STATUS[p.status] ?? { rotulo: p.status, cor: "text-zinc-500" };
              return (
                <tr key={p.mpPaymentId}>
                  <td className="px-4 py-3 text-zinc-500">
                    {p.createdAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{a?.titulo ?? "(álbum excluído)"}</p>
                    <p className="text-xs text-zinc-500">{email.get(p.ownerId.toString()) ?? "-"}</p>
                  </td>
                  <td className="px-4 py-3">{p.planoId ?? "-"}</td>
                  <td className="px-4 py-3 font-medium">{formatarPreco(p.valorCentavos)}</td>
                  <td className="px-4 py-3 text-zinc-500">{(p.metodo && METODO[p.metodo]) ?? p.metodo ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${s.cor}`}>{s.rotulo}</span>
                    <a
                      href={`https://www.mercadopago.com.br/activities?q=${p.mpPaymentId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-2 text-xs text-zinc-400 hover:text-violet-600"
                    >
                      #{p.mpPaymentId} ↗
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {lista.length === 0 && <p className="px-4 py-10 text-center text-sm text-zinc-500">Nenhum pagamento ainda.</p>}
      </div>
    </div>
  );
}
