/**
 * Adresses publiques de l'application.
 *
 * Better Auth refuse (INVALID_ORIGIN) toute connexion venant d'une adresse
 * qu'il ne connaît pas. Sur Vercel, on accepte donc aussi les adresses que la
 * plateforme fournit elle-même (variables système) : le domaine de production
 * et l'adresse du déploiement courant. Une erreur de saisie de BETTER_AUTH_URL
 * ne bloque ainsi plus les connexions.
 */
// Variables lues : BETTER_AUTH_URL, VERCEL_ENV, VERCEL_PROJECT_PRODUCTION_URL, VERCEL_URL, VERCEL_BRANCH_URL.
type Env = Record<string, string | undefined>;

const toOrigin = (value: string | undefined) => {
  if (!value) return null;
  try {
    return new URL(value.includes("://") ? value : `https://${value}`).origin;
  } catch {
    return null;
  }
};

/** Adresse canonique : liens d'invitation, base de Better Auth. */
export function canonicalOrigin(env: Env = process.env): string | undefined {
  const production = toOrigin(env.VERCEL_PROJECT_PRODUCTION_URL);
  if (env.VERCEL_ENV === "production" && production) return production;
  return toOrigin(env.BETTER_AUTH_URL) ?? production ?? undefined;
}

/** Toutes les adresses depuis lesquelles une connexion est acceptée. */
export function trustedOrigins(env: Env = process.env): string[] {
  const candidates = [env.BETTER_AUTH_URL, env.VERCEL_PROJECT_PRODUCTION_URL, env.VERCEL_URL, env.VERCEL_BRANCH_URL];
  return [...new Set(candidates.map(toOrigin).filter((o): o is string => o !== null))];
}
