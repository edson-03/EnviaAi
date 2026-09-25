"use client";

import { useActionState } from "react";
import type { EstadoForm } from "../../../novo/actions";
import { TIPOS_EVENTO } from "../../../novo/tipos-evento";

type Valores = { titulo: string; tipoEvento?: string; dataEvento?: string; mensagemBoasVindas?: string };

export function FormEditar({
  acao,
  valores,
}: {
  acao: (estado: EstadoForm, form: FormData) => Promise<EstadoForm>;
  valores: Valores;
}) {
  const [estado, enviarForm, enviando] = useActionState(acao, {});

  return (
    <form action={enviarForm} className="mt-6 flex flex-col gap-5">
      <label className="rotulo">
        Nome do evento
        <input name="titulo" required maxLength={120} defaultValue={valores.titulo} className="campo" />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="rotulo">
          Tipo de evento (opcional)
          <select name="tipoEvento" defaultValue={valores.tipoEvento ?? ""} className="campo">
            <option value="">Selecione</option>
            {TIPOS_EVENTO.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>

        <label className="rotulo">
          Data do evento (opcional)
          <input type="date" name="dataEvento" defaultValue={valores.dataEvento} className="campo" />
        </label>
      </div>

      <label className="rotulo">
        Mensagem para os convidados (opcional)
        <textarea
          name="mensagemBoasVindas"
          maxLength={500}
          rows={3}
          defaultValue={valores.mensagemBoasVindas}
          placeholder="Compartilhe suas fotos e vídeos deste momento."
          className="campo resize-y"
        />
        <span className="text-xs font-normal text-zinc-500">Aparece no topo da página de envio. Até 500 caracteres.</span>
      </label>

      {estado.erro && (
        <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          {estado.erro}
        </p>
      )}

      <button disabled={enviando} className="btn-primario py-3 text-base">
        {enviando ? "Salvando..." : "Salvar alterações"}
      </button>
    </form>
  );
}
