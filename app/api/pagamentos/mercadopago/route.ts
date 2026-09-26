// Aviso (webhook) do Mercado Pago. Só usamos o id do pagamento; o status é conferido na API.
import { processarPagamento } from "@/lib/mercadopago";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const corpo = (await req.json().catch(() => ({}))) as { type?: string; action?: string; data?: { id?: string | number } };

  const tipo = corpo.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  const id = String(corpo.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "");

  if (tipo === "payment" && id) {
    try {
      await processarPagamento(id);
    } catch (e) {
      console.error("Falha ao processar pagamento do Mercado Pago", id, e);
      return new Response(null, { status: 500 }); // o Mercado Pago tenta de novo
    }
  }
  return new Response(null, { status: 200 });
}
