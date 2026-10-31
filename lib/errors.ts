import { ForbiddenError } from "@/lib/authz/policy";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";

/** Erreur métier dont le message peut être affiché tel quel à l'utilisateur. */
export class BusinessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BusinessError";
  }
}

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Convertit une erreur levée par un service en résultat d'action affichable.
 * Les erreurs inattendues sont journalisées côté serveur et masquées au client.
 */
export function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof ForbiddenError) {
    return { ok: false, error: "Vous n'êtes pas autorisé(e) à effectuer cette action." };
  }
  if (error instanceof BusinessError) {
    return { ok: false, error: error.message };
  }
  if (error instanceof z.ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const key = issue.path.join(".") || "_";
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return { ok: false, error: "Certains champs sont invalides.", fieldErrors };
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return { ok: false, error: "Cet enregistrement existe déjà." };
  }
  console.error(error);
  return { ok: false, error: "Une erreur inattendue est survenue. Réessayez ou contactez l'administrateur." };
}
