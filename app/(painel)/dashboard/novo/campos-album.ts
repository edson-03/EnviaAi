import { TIPOS_EVENTO } from "./tipos-evento";

export type CamposAlbum = {
  titulo: string;
  tipoEvento?: string;
  dataEvento?: Date;
  mensagemBoasVindas?: string;
};

// Validação compartilhada entre criar e editar álbum. Campos vazios viram undefined.
export function lerCamposAlbum(form: FormData): { erro: string } | { campos: CamposAlbum } {
  const titulo = String(form.get("titulo") ?? "").trim();
  const tipoEvento = String(form.get("tipoEvento") ?? "");
  const data = String(form.get("dataEvento") ?? "");
  const mensagem = String(form.get("mensagemBoasVindas") ?? "").trim();

  if (!titulo || titulo.length > 120) return { erro: "Informe um título de até 120 caracteres." };
  if (tipoEvento && !TIPOS_EVENTO.includes(tipoEvento)) return { erro: "Tipo de evento inválido." };
  const dataEvento = data ? new Date(`${data}T00:00:00Z`) : undefined;
  if (dataEvento && isNaN(dataEvento.getTime())) return { erro: "Data inválida." };
  if (mensagem.length > 500) return { erro: "A mensagem de boas-vindas pode ter até 500 caracteres." };

  return {
    campos: {
      titulo,
      tipoEvento: tipoEvento || undefined,
      dataEvento,
      mensagemBoasVindas: mensagem || undefined,
    },
  };
}
