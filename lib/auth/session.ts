import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { can, type Action, type Actor, type Resource, type Role } from "@/lib/authz/policy";

export type CurrentUser = Actor & { name: string; email: string; image: string | null };

/**
 * Couche d'accès à la session (DAL). Le rôle et le statut sont relus en base à
 * chaque requête : une désactivation ou un changement de rôle prend effet
 * immédiatement, sans attendre l'expiration de la session.
 *
 * Volontairement sans "use cache" : ces données dépendent de l'utilisateur et
 * ne doivent jamais être partagées entre requêtes.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, active: true, image: true },
  });
  if (!user || !user.active) return null;
  return { id: user.id, name: user.name, email: user.email, image: user.image, role: user.role as Role };
});

/** Utilisateur connecté obligatoire, sinon redirection vers la connexion. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  return user;
}

/** Utilisateur connecté et autorisé, sinon page 403. */
export async function requirePermission(action: Action, resource?: Resource): Promise<CurrentUser> {
  const user = await requireUser();
  if (!can(user, action, resource)) forbidden();
  return user;
}
