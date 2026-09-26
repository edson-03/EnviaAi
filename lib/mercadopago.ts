// Mercado Pago (Checkout Pro) via API REST. O status do pagamento é sempre conferido na API,
// nunca aceito só pelo aviso (webhook) ou pela URL de retorno. Somente servidor.
import { ObjectId } from "mongodb";
import { albums, pagamentos, planos, type Plano } from "./mongodb";
import { copiaDoPlano } from "./planos";

const API = "https://api.mercadopago.com";

function token() {
  const t = process.env.MP_ACCESS_TOKEN;
  if (!t) throw new Error("MP_ACCESS_TOKEN não definida");
  return t;
}

export function modoMercadoPago(): "nao-configurado" | "teste" | "producao" {
  const t = process.env.MP_ACCESS_TOKEN;
  if (!t) return "nao-configurado";
  return t.startsWith("TEST-") ? "teste" : "producao";
}

// Confere se a chave funciona (usado no /admin/pagamentos).
export async function testarConexao() {
  const res = await fetch(`${API}/users/me`, { headers: { Authorization: `Bearer ${token()}` }, cache: "no-store" });
  if (!res.ok) return { ok: false as const, erro: `Mercado Pago respondeu ${res.status}` };
  const u = (await res.json()) as { nickname?: string; email?: string; site_id?: string };
  return { ok: true as const, conta: u.email ?? u.nickname ?? "conta sem e-mail", site: u.site_id };
}

// external_reference = "<albumId>:<planoId>:<precoCentavos>": o que foi vendido, gravado na própria cobrança.
function referencia(albumId: ObjectId, plano: Plano) {
  return `${albumId.toString()}:${plano._id}:${plano.precoCentavos}`;
}

// Cria a cobrança (preferência) e devolve a URL da página de pagamento do Mercado Pago.
export async function criarCheckout(album: { _id: ObjectId; slug: string; titulo: string }, plano: Plano, emailPagador: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  const volta = `${base}/dashboard/a/${album.slug}/premium`;
  const res = await fetch(`${API}/checkout/preferences`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [
        {
          id: `plano-${plano._id}`,
          title: `Enviaí ${plano.nome} · ${album.titulo}`.slice(0, 250),
          quantity: 1,
          currency_id: "BRL",
          unit_price: plano.precoCentavos / 100,
        },
      ],
      external_reference: referencia(album._id, plano),
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
  return modoMercadoPago() === "teste" ? (dados.sandbox_init_point ?? dados.init_point) : dados.init_point;
}

type PagamentoMP = {
  id: number;
  status: string;
  external_reference?: string;
  transaction_amount: number;
  payment_type_id?: string;
};

// Busca o pagamento na API, registra e libera (ou retira) o plano do álbum.
export async function processarPagamento(mpPaymentId: string) {
  if (!/^\d{1,20}$/.test(mpPaymentId)) return;
  const res = await fetch(`${API}/v1/payments/${mpPaymentId}`, { headers: { Authorization: `Bearer ${token()}` }, cache: "no-store" });
  if (!res.ok) return;
  const p = (await res.json()) as PagamentoMP;

  const [albumId, planoId, precoTxt] = (p.external_reference ?? "").split(":");
  if (!ObjectId.isValid(albumId ?? "") || !planoId || !precoTxt) return;
  const album = await albums.findOne({ _id: new ObjectId(albumId) }, { projection: { ownerId: 1, planoPagamentoId: 1 } });
  if (!album) return;

  const agora = new Date();
  const valorCentavos = Math.round(p.transaction_amount * 100);
  // Documento ANTERIOR: evita aplicar o mesmo pagamento duas vezes (o aviso pode chegar repetido).
  const anterior = await pagamentos.findOneAndUpdate(
    { mpPaymentId: String(p.id) },
    {
      $set: { status: p.status, valorCentavos, ...(p.payment_type_id && { metodo: p.payment_type_id }), atualizadoEm: agora },
      $setOnInsert: { albumId: album._id, ownerId: album.ownerId, planoId, createdAt: agora },
    },
    { upsert: true },
  );

  if (p.status === "approved" && anterior?.status !== "approved" && valorCentavos >= Number(precoTxt)) {
    const plano = await planos.findOne({ _id: planoId });
    if (plano) {
      await albums.updateOne(
        { _id: album._id },
        {
          $set: {
            planoContratado: copiaDoPlano(plano, valorCentavos),
            planoDesde: agora,
            planoPagamentoId: String(p.id),
            ...(plano.validadeDias && { planoExpiraEm: new Date(agora.getTime() + plano.validadeDias * 86400000) }),
          },
          ...(!plano.validadeDias && { $unset: { planoExpiraEm: 1 } }),
        },
      );
    }
  }

  // Estorno/contestação do pagamento que liberou o plano: o álbum volta ao grátis.
  if ((p.status === "refunded" || p.status === "charged_back") && album.planoPagamentoId === String(p.id)) {
    await albums.updateOne(
      { _id: album._id },
      { $unset: { planoContratado: 1, planoDesde: 1, planoExpiraEm: 1, planoPagamentoId: 1 } },
    );
  }
}
