import { exigirAdmin } from "@/lib/admin";
import { albums, planos, type Plano } from "@/lib/mongodb";
import { formatarPreco, formatarTamanho } from "@/lib/planos";
import { salvarPlano } from "../actions";
import { FormPlano, type ValoresPlano } from "./form-plano";

const GB = 1024 ** 3;

function valoresDoPlano(p: Plano): ValoresPlano {
  return {
    id: p._id,
    nome: p.nome,
    tipo: p.tipo,
    preco: (p.precoCentavos / 100).toFixed(2).replace(".", ","),
    limiteArquivos: p.limiteArquivos,
    maxGb: String(Math.round((p.maxBytesArquivo / GB) * 100) / 100),
    telao: p.telao,
    personalizacao: p.personalizacao,
    validadeDias: p.validadeDias,
    albunsAtivos: p.albunsAtivos,
    ativo: p.ativo,
    ordem: p.ordem,
  };
}

export default async function AdminPlanos() {
  await exigirAdmin();
  const [lista, contratos] = await Promise.all([
    planos.find().sort({ ordem: 1, precoCentavos: 1 }).toArray(),
    albums.aggregate<{ _id: string; total: number }>([
      { $match: { planoContratado: { $exists: true } } },
      { $group: { _id: "$planoContratado._id", total: { $sum: 1 } } },
    ]).toArray(),
  ]);
  const vendidos = new Map(contratos.map((c) => [c._id, c.total]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Planos</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Preço, limites e recursos de cada plano. Alterações valem para <strong>novas compras</strong>; quem já comprou
          mantém o que contratou. O plano grátis vale sempre pela configuração atual.
        </p>
      </div>

      {lista.map((p) => (
        <details key={p._id} className="cartao group p-5">
          <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 font-semibold">
                {p.nome}
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-500 dark:bg-zinc-800">{p._id}</span>
                {p.tipo === "gratis" ? (
                  <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs dark:bg-zinc-700">Grátis</span>
                ) : p.ativo ? (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-950 dark:text-green-300">À venda</span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">Fora de venda</span>
                )}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                {[
                  p.tipo === "pago" ? formatarPreco(p.precoCentavos) : `${p.albunsAtivos ?? 1} álbum(ns) ativo(s)`,
                  `${p.limiteArquivos.toLocaleString("pt-BR")} arquivos`,
                  `até ${formatarTamanho(p.maxBytesArquivo)}/arquivo`,
                  p.validadeDias ? `${p.validadeDias} dias` : "sem prazo",
                  p.telao && "telão",
                  p.personalizacao && "cor/capa",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              {p.tipo === "pago" && <span className="text-zinc-500">{vendidos.get(p._id) ?? 0} álbum(ns) com este plano</span>}
              <span className="font-medium text-violet-600 group-open:hidden">Editar</span>
              <span className="hidden font-medium text-zinc-500 group-open:inline">Fechar</span>
            </div>
          </summary>
          <div className="mt-5 border-t border-zinc-100 pt-5 dark:border-zinc-800">
            <FormPlano acao={salvarPlano.bind(null, p._id)} valores={valoresDoPlano(p)} />
          </div>
        </details>
      ))}

      <section className="cartao border-dashed p-5">
        <h2 className="text-lg font-semibold">Novo plano pago</h2>
        <p className="mt-1 text-sm text-zinc-500">Aparece para os organizadores assim que estiver marcado como “À venda”.</p>
        <div className="mt-5">
          <FormPlano acao={salvarPlano.bind(null, null)} novo />
        </div>
      </section>
    </div>
  );
}
