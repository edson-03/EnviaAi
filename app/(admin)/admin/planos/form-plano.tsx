"use client";

import { useActionState } from "react";
import type { EstadoPlano } from "../actions";

export type ValoresPlano = {
  id: string;
  nome: string;
  tipo: "gratis" | "pago";
  preco: string; // "29,90"
  limiteArquivos: number;
  maxGb: string; // "4"
  telao: boolean;
  personalizacao: boolean;
  validadeDias: number | null;
  albunsAtivos?: number;
  ativo: boolean;
  ordem: number;
};

function Campo({ rotulo, ajuda, children }: { rotulo: string; ajuda?: string; children: React.ReactNode }) {
  return (
    <label className="rotulo">
      {rotulo}
      {children}
      {ajuda && <span className="text-xs font-normal text-zinc-500">{ajuda}</span>}
    </label>
  );
}

export function FormPlano({
  acao,
  valores,
  novo,
}: {
  acao: (estado: EstadoPlano, form: FormData) => Promise<EstadoPlano>;
  valores?: ValoresPlano;
  novo?: boolean;
}) {
  const [estado, enviar, salvando] = useActionState(acao, {});
  const gratis = valores?.tipo === "gratis";

  return (
    <form action={enviar} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {novo && (
          <Campo rotulo="Código" ajuda="Não muda depois. Ex.: basico, completo">
            <input name="id" required pattern="[a-z0-9\-]{2,40}" className="campo" />
          </Campo>
        )}
        <Campo rotulo="Nome">
          <input name="nome" required maxLength={60} defaultValue={valores?.nome} className="campo" />
        </Campo>
        {!gratis && (
          <Campo rotulo="Preço (R$)" ajuda="Pagamento único por evento">
            <input name="preco" required inputMode="decimal" defaultValue={valores?.preco} placeholder="29,90" className="campo" />
          </Campo>
        )}
        <Campo rotulo="Limite de arquivos por álbum">
          <input name="limiteArquivos" type="number" min={1} max={100000} required defaultValue={valores?.limiteArquivos} className="campo" />
        </Campo>
        <Campo rotulo="Tamanho máximo por arquivo (GB)" ajuda="Até 20 GB">
          <input name="maxGb" required inputMode="decimal" defaultValue={valores?.maxGb ?? "4"} className="campo" />
        </Campo>
        <Campo
          rotulo="Validade (dias recebendo arquivos)"
          ajuda={gratis ? "Conta a partir da criação do álbum. Vazio = sem prazo" : "Conta a partir da compra. Vazio = sem prazo"}
        >
          <input name="validadeDias" type="number" min={1} max={3650} defaultValue={valores?.validadeDias ?? ""} className="campo" />
        </Campo>
        {gratis && (
          <Campo rotulo="Álbuns recebendo ao mesmo tempo">
            <input name="albunsAtivos" type="number" min={1} max={50} required defaultValue={valores?.albunsAtivos ?? 1} className="campo" />
          </Campo>
        )}
        <Campo rotulo="Ordem de exibição">
          <input name="ordem" type="number" defaultValue={valores?.ordem ?? 10} className="campo" />
        </Campo>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="telao" defaultChecked={valores?.telao} className="h-4 w-4 accent-violet-600" /> Telão ao vivo
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="personalizacao" defaultChecked={valores?.personalizacao} className="h-4 w-4 accent-violet-600" />
          Cor e capa
        </label>
        {!gratis && (
          <label className="flex items-center gap-2">
            <input type="checkbox" name="ativo" defaultChecked={valores?.ativo ?? true} className="h-4 w-4 accent-violet-600" />
            À venda
          </label>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button disabled={salvando} className="btn-primario">
          {salvando ? "Salvando..." : novo ? "Criar plano" : "Salvar"}
        </button>
        {estado.erro && <p className="text-sm text-red-600">{estado.erro}</p>}
        {estado.ok && <p className="text-sm text-green-600">Salvo.</p>}
      </div>
    </form>
  );
}
