// Limite de requisições por IP em janelas fixas, guardado no MongoDB (funciona entre
// instâncias da Vercel). Somente servidor.
import { rateLimits } from "./mongodb";

// Na Vercel, x-forwarded-for é preenchido pela própria plataforma (o cliente não controla).
export function ipDaRequisicao(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "desconhecido";
}

export async function excedeuLimite(chave: string, limite: number, janelaMs: number) {
  const janela = Math.floor(Date.now() / janelaMs);
  const doc = await rateLimits.findOneAndUpdate(
    { _id: `${chave}:${janela}` },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((janela + 1) * janelaMs) } },
    { upsert: true, returnDocument: "after" },
  );
  return (doc?.count ?? 0) > limite;
}
