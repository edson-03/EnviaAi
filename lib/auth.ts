// Better Auth: login do organizador com Google + autorização do Drive. Somente servidor.
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { client, db } from "./mongodb";

export const auth = betterAuth({
  database: mongodbAdapter(db, { client }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      scope: ["https://www.googleapis.com/auth/drive.file"],
      accessType: "offline", // garante refresh token
      prompt: "consent",
    },
  },
  account: {
    encryptOAuthTokens: true,
  },
  user: {
    additionalFields: {
      // Controlados pelo backend (pagamento / administração); o usuário não pode alterar.
      plano: { type: "string", defaultValue: "free", input: false },
      suspenso: { type: "boolean", defaultValue: false, input: false },
    },
  },
  databaseHooks: {
    session: {
      create: {
        // Conta suspensa pelo /admin não consegue entrar.
        async before(session, ctx) {
          if (!ctx) return;
          const usuario = await ctx.context.internalAdapter.findUserById(session.userId);
          if ((usuario as { suspenso?: boolean } | null)?.suspenso) {
            throw APIError.from("FORBIDDEN", { message: "Conta suspensa", code: "CONTA_SUSPENSA" });
          }
        },
      },
    },
  },
  onAPIError: { errorURL: "/entrar" }, // erros no login voltam para /entrar?error=...
  plugins: [nextCookies()],
});
