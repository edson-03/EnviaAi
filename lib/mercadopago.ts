// Mercado Pago (Checkout Pro) via API REST. O status do pagamento é sempre conferido na API,
// nunca aceito só pelo aviso (webhook) ou pela URL de retorno. Somente servidor.
import { ObjectId } from "mongodb";
import { albums, pagamentos } from "./mongodb";
import { PRECO_PREMIUM_CENTAVOS } from "./planos";

const API = "https://api.mercadopago.com";

function token() {
  const t = process.env.MP_ACCESS_TOKEN;
  if (!t) throw new Error("MP_ACCESS_TOKEN não definida");
  return t;
}

// Cria a "preferência" (a cobrança) e devolve a URL da página de pagamento do Mercado Pago.
export async function criarCheckout(album: { _id: ObjectId; slug: string; titulo: string }, emailPagador: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  const volta = `${base}/dashboard/a/${album.slug}/premium`;
  const res = await fetch(`${API}/checkout/preferences`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [
        {
          id: "premium-evento",
          title: `Enviaí Premium · ${album.titulo}`.slice(0, 250),
          quantity: 1,
          currency_id: "BRL",
          unit_price: PRECO_PREMIUM_CENTAVOS / 100,
        },
      ],
      external_reference: album._id.toString(),
      payer: { email: emailPagador },
      back_urls: { success: `${volta}?retorno=ok`, pending: `${volta}?retorno=pendente`, failure: `${volta}?retorno=falha` },
      auto_return: "approved",
      notification_url: `${base}/api/pagamentos/mercadopago`,
      statement_descriptor: "ENVIAI",
    }),
  });
  if (!res.ok) throw new Error(`Mercado Pago recusou a preferência: ${res.status} ${await res.text()}`);
  const dados = (await res.json()) as { init_point: string; sandbox_init_point?: string };
  // Credenciais de teste usam o ambiente de testes do Mercado Pago.
  return token().startsWith("TEST-") ? (dados.sandbox_init_point ?? dados.init_point) : dados.init_point;
}

type PagamentoMP = {
  id: number;
  status: string;
  external_reference?: string;
  transaction_amount: number;
  payment_type_id?: string;
};

// Busca o pagamento na API, registra e libera (ou retira) o premium do álbum.
export async function processarPagamento(mpPaymentId: string) {
  if (!/^\d{1,20}$/.test(mpPaymentId)) return;
  const res = await fetch(`${API}/v1/payments/${mpPaymentId}`, { headers: { Authorization: `Bearer ${token()}` }, cache: "no-store" });
  if (!res.ok) return;
  const p = (await res.json()) as PagamentoMP;
  if (!p.external_reference || !ObjectId.isValid(p.external_reference)) return;

  const album = await albums.findOne({ _id: new ObjectId(p.external_reference) }, { projection: { ownerId: 1, premium: 1 } });
  if (!album) return;

  const agora = new Date();
  await pagamentos.updateOne(
    { mpPaymentId: String(p.id) },
    {
      $set: {
        status: p.status,
        valorCentavos: Math.round(p.transaction_amount * 100),
        ...(p.payment_type_id && { metodo: p.payment_type_id }),
        atualizadoEm: agora,
      },
      $setOnInsert: { albumId: album._id, ownerId: album.ownerId, createdAt: agora },
    },
    { upsert: true },
  );

  const valorOk = Math.round(p.transaction_amount * 100) >= PRECO_PREMIUM_CENTAVOS;
  if (p.status === "approved" && valorOk && !album.premium) {
    await albums.updateOne({ _id: album._id }, { $set: { premium: true, premiumDesde: agora } });
  }
  // Estorno/contestação: retira o premium se não houver outro pagamento aprovado para o álbum.
  if ((p.status === "refunded" || p.status === "charged_back") && album.premium) {
    const outroAprovado = await pagamentos.countDocuments({ albumId: album._id, status: "approved" }, { limit: 1 });
    if (!outroAprovado) await albums.updateOne({ _id: album._id }, { $unset: { premium: 1, premiumDesde: 1 } });
  }
}
