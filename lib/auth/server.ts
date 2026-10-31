import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";

/**
 * Authentification DIWAA Finance (Better Auth, sessions stockées dans Neon).
 * - Pas d'inscription publique : les comptes sont créés par l'administrateur
 *   (lib/services/users.ts) ou par le script d'amorçage scripts/create-admin.ts.
 * - `role` et `active` ne sont jamais modifiables par l'API d'authentification.
 * - Un compte désactivé ne peut plus ouvrir de session.
 */
export const auth = betterAuth({
  appName: "DIWAA Finance",
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 10,
    revokeSessionsOnPasswordReset: true,
  },
  session: {
    expiresIn: 60 * 60 * 8, // 8 h : poste de travail partagé possible
    updateAge: 60 * 60,
  },
  user: {
    additionalFields: {
      role: { type: "string", input: false, required: false },
      active: { type: "boolean", input: false, required: false },
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await db.user.findUnique({
            where: { id: session.userId },
            select: { active: true },
          });
          return user?.active === true;
        },
      },
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  plugins: [nextCookies()], // doit rester le dernier plugin
});
