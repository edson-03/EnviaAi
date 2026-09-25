// Envio de e-mail pela API do Resend. Sem RESEND_API_KEY, não envia (só registra no log). Somente servidor.

const REMETENTE = process.env.EMAIL_REMETENTE ?? "Enviaí <avisos@enviaai.site>";

export async function enviarEmail(para: string, assunto: string, html: string) {
  const chave = process.env.RESEND_API_KEY;
  if (!chave) {
    console.warn("RESEND_API_KEY não definida: e-mail não enviado", assunto);
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: REMETENTE, to: [para], subject: assunto, html }),
  });
  if (!res.ok) console.error("Resend recusou o e-mail", res.status, await res.text());
  return res.ok;
}

export function escaparHtml(texto: string) {
  return texto.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
