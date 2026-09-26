import { processarPagamento } from "@/lib/mercadopago";
import { albums, pagamentos } from "@/lib/mongodb";
import { LIMITE_ARQUIVOS_GRATIS, precoFormatado } from "@/lib/planos";
import { MAX_ARQUIVOS_POR_ALBUM } from "@/lib/upload-limits";
import { iniciarPagamento } from "../actions";
import { albumDoDono } from "../dados";

const n = (x: number) => x.toLocaleString("pt-BR");

const RECURSOS: { nome: string; gratis: string | boolean; premium: string | boolean }[] = [
  { nome: "Arquivos por álbum", gratis: n(LIMITE_ARQUIVOS_GRATIS), premium: n(MAX_ARQUIVOS_POR_ALBUM) },
  { nome: "Telão ao vivo", gratis: false, premium: true },
  { nome: "Cor do evento e foto de capa", gratis: false, premium: true },
  { nome: "Não conta no limite de 1 álbum ativo", gratis: false, premium: true },
  { nome: "Placa para imprimir, recados, estatísticas, resumo por e-mail", gratis: true, premium: true },
];

function Valor({ v }: { v: string | boolean }) {
  if (typeof v === "string") return <span className="font-medium">{v}</span>;
  return v ? <span className="font-bold text-green-600">✓</span> : <span className="text-zinc-400">—</span>;
}

export default async function PremiumPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ retorno?: string; payment_id?: string }>;
}) {
  const [{ slug }, { retorno, payment_id }] = await Promise.all([params, searchParams]);
  const { album: albumInicial, premium: premiumInicial } = await albumDoDono(slug);

  // Voltou do Mercado Pago: confere o pagamento na hora (o aviso por webhook pode demorar alguns segundos).
  if (payment_id) await processarPagamento(payment_id).catch((e) => console.error("Falha ao conferir pagamento", e));
  const album = payment_id ? ((await albums.findOne({ _id: albumInicial._id })) ?? albumInicial) : albumInicial;
  const premium = premiumInicial || Boolean(album.premium);
  const pago = album.premium
    ? await pagamentos.findOne({ albumId: album._id, status: "approved" }, { sort: { createdAt: -1 } })
    : null;
  const pagamentoConfigurado = Boolean(process.env.MP_ACCESS_TOKEN);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {retorno === "pendente" && !premium && (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <strong>Pagamento em processamento.</strong> Assim que o Mercado Pago confirmar (Pix costuma ser na hora; boleto leva
          até 3 dias úteis), o premium é liberado automaticamente.
        </p>
      )}
      {retorno === "falha" && !premium && (
        <p className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          <strong>O pagamento não foi concluído.</strong> Nenhum valor foi cobrado. Você pode tentar de novo abaixo.
        </p>
      )}

      {premium ? (
        <section className="cartao overflow-hidden">
          <div className="bg-gradient-to-br from-violet-600 to-fuchsia-500 p-6 text-white">
            <p className="text-sm font-semibold uppercase tracking-wide text-white/80">Premium ativo</p>
            <h2 className="mt-1 text-2xl font-bold">Tudo liberado para “{album.titulo}”</h2>
            {pago && (
              <p className="mt-2 text-sm text-white/80">
                Pago em {pago.createdAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}.
              </p>
            )}
          </div>
          <ul className="grid gap-2 p-6 text-sm sm:grid-cols-2">
            {RECURSOS.map((r) => (
              <li key={r.nome} className="flex items-center gap-2">
                <span className="font-bold text-green-600">✓</span>
                {r.nome}
                {typeof r.premium === "string" && <span className="text-zinc-500">({r.premium})</span>}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <>
          <section className="cartao overflow-hidden">
            <div className="bg-gradient-to-br from-violet-600 to-fuchsia-500 p-6 text-white">
              <p className="text-sm font-semibold uppercase tracking-wide text-white/80">Premium para este evento</p>
              <p className="mt-2 text-4xl font-bold">
                {precoFormatado()} <span className="text-base font-medium text-white/80">pagamento único</span>
              </p>
              <p className="mt-1 text-sm text-white/80">Vale para o álbum “{album.titulo}”, sem mensalidade.</p>
            </div>
            <div className="p-6">
              {pagamentoConfigurado ? (
                <form action={iniciarPagamento.bind(null, slug)}>
                  <button className="btn-primario w-full py-3 text-base">Pagar com Mercado Pago</button>
                </form>
              ) : (
                <p className="rounded-lg bg-zinc-100 p-3 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  O pagamento online ainda está sendo configurado. Volte em breve.
                </p>
              )}
              <p className="mt-3 text-center text-xs text-zinc-500">
                Pix, cartão de crédito ou boleto, na página segura do Mercado Pago. Liberação automática após a confirmação.
              </p>
            </div>
          </section>

          <section className="cartao overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Recurso</th>
                  <th className="px-5 py-3 font-medium">Grátis</th>
                  <th className="px-5 py-3 font-medium text-violet-600">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {RECURSOS.map((r) => (
                  <tr key={r.nome}>
                    <td className="px-5 py-3">{r.nome}</td>
                    <td className="px-5 py-3 text-center">
                      <Valor v={r.gratis} />
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Valor v={r.premium} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      <p className="text-center text-xs text-zinc-500">
        Mudou de ideia? Você pode pedir o reembolso em até 7 dias após o pagamento pelo e-mail edsonsilvat03@gmail.com.
      </p>
    </div>
  );
}
