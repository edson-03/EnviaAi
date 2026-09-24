// Better Auth: login do organizador com Google + autorização do Drive. Somente servidor.
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
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
      // Controlado pelo backend (pagamento); o usuário não pode alterar.
      plano: { type: "string", defaultValue: "free", input: false },
    },
  },
  plugins: [nextCookies()],
});
