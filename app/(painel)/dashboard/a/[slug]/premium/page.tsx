import { modoMercadoPago, processarPagamento } from "@/lib/mercadopago";
import { albums, type PlanoContratado } from "@/lib/mongodb";
import { formatarPreco, formatarTamanho, planoGratis, planosAVenda, situacaoDoAlbum } from "@/lib/planos";
import { iniciarPagamento } from "../actions";
import { albumDoDono } from "../dados";

const n = (x: number) => x.toLocaleString("pt-BR");

// Lista de recursos de um plano, no mesmo formato para grátis, pago e contratado.
function Recursos({ p, albunsAtivos }: { p: PlanoContratado; albunsAtivos?: number }) {
  const itens: [boolean, string][] = [
    [true, `Até ${n(p.limiteArquivos)} arquivos`],
    [true, `Arquivos de até ${formatarTamanho(p.maxBytesArquivo)}`],
    [p.telao, "Telão ao vivo"],
    [p.personalizacao, "Cor do evento e foto de capa"],
    [true, p.validadeDias ? `Recebe arquivos por ${p.validadeDias} dias` : "Recebe arquivos sem prazo"],
    [true, "Placa, recados, estatísticas e resumo por e-mail"],
  ];
  if (albunsAtivos) itens.push([true, `${albunsAtivos} ${albunsAtivos === 1 ? "álbum recebendo" : "álbuns recebendo"} por vez`]);
  return (
    <ul className="space-y-2 text-sm">
      {itens.map(([ok, texto]) => (
        <li key={texto} className={`flex gap-2 ${ok ? "" : "text-zinc-400 line-through"}`}>
          <span className={ok ? "font-bold text-green-600" : ""}>{ok ? "✓" : "—"}</span>
          {texto}
        </li>
      ))}
    </ul>
  );
}

export default async function PlanosDoAlbumPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ retorno?: string; payment_id?: string }>;
}) {
  const [{ slug }, { retorno, payment_id }] = await Promise.all([params, searchParams]);
  const { session, album: albumInicial, situacao: situacaoInicial } = await albumDoDono(slug);

  // Voltou do Mercado Pago: confere o pagamento na hora (o aviso por webhook pode demorar alguns segundos).
  let situacao = situacaoInicial;
  if (payment_id && modoMercadoPago() !== "nao-configurado") {
    await processarPagamento(payment_id).catch((e) => console.error("Falha ao conferir pagamento", e));
    const atualizado = await albums.findOne({ _id: albumInicial._id });
    if (atualizado) situacao = await situacaoDoAlbum(atualizado, (session.user as { plano?: string }).plano ?? null);
  }

  const [aVenda, gratis] = await Promise.all([planosAVenda(), planoGratis()]);
  const pagamentoConfigurado = modoMercadoPago() !== "nao-configurado";

  return (
    <div className="flex flex-col gap-6">
      {retorno === "pendente" && !situacao.pago && (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <strong>Pagamento em processamento.</strong> Assim que o Mercado Pago confirmar (Pix costuma ser na hora; boleto leva
          até 3 dias úteis), o plano é liberado automaticamente.
        </p>
      )}
      {retorno === "falha" && !situacao.pago && (
        <p className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          <strong>O pagamento não foi concluído.</strong> Nenhum valor foi cobrado. Você pode tentar de novo abaixo.
        </p>
      )}

      {situacao.pago ? (
        <section className="cartao overflow-hidden">
          <div className="bg-gradient-to-br from-violet-600 to-fuchsia-500 p-6 text-white">
            <p className="text-sm font-semibold uppercase tracking-wide text-white/80">
              {situacao.cortesia ? "Cortesia ativa" : "Plano ativo"}
            </p>
            <h2 className="mt-1 text-2xl font-bold">{situacao.plano.nome}</h2>
            {situacao.prazoFinal && (
              <p className="mt-2 text-sm text-white/80">
                Recebe arquivos até {situacao.prazoFinal.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}.
              </p>
            )}
          </div>
          <div className="p-6">
            <Recursos p={situacao.plano} />
          </div>
        </section>
      ) : (
        <>
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {situacao.planoVencido ? "Renove o plano deste álbum" : "Escolha um plano para este álbum"}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">Pagamento único por evento, sem mensalidade.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <section className="cartao flex flex-col p-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Atual</p>
              <h3 className="mt-1 text-lg font-bold">{gratis.nome}</h3>
              <p className="mt-1 text-3xl font-bold">R$ 0</p>
              <div className="mt-5 flex-1">
                <Recursos p={situacao.plano} albunsAtivos={gratis.albunsAtivos} />
              </div>
            </section>

            {aVenda.map((p) => (
              <section key={p._id} className="cartao flex flex-col border-violet-300 p-6 dark:border-violet-800">
                <p className="text-sm font-semibold uppercase tracking-wide text-violet-600">Por evento</p>
                <h3 className="mt-1 text-lg font-bold">{p.nome}</h3>
                <p className="mt-1 text-3xl font-bold">{formatarPreco(p.precoCentavos)}</p>
                <div className="mt-5 flex-1">
                  <Recursos p={p} />
                </div>
                {pagamentoConfigurado ? (
                  <form action={iniciarPagamento.bind(null, slug, p._id)} className="mt-6">
                    <button className="btn-primario w-full py-3">Contratar {p.nome}</button>
                  </form>
                ) : (
                  <p className="mt-6 rounded-lg bg-zinc-100 p-3 text-center text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    Pagamento online em configuração.
                  </p>
                )}
              </section>
            ))}
          </div>
          <p className="text-center text-xs text-zinc-500">
            Pix, cartão de crédito ou boleto, na página segura do Mercado Pago. Liberação automática após a confirmação.
          </p>
        </>
      )}

      <p className="text-center text-xs text-zinc-500">
        Mudou de ideia? Você pode pedir o reembolso em até 7 dias após o pagamento pelo e-mail edsonsilvat03@gmail.com.
      </p>
    </div>
  );
}
