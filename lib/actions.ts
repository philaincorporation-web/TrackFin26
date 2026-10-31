import "server-only";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/session";
import { toActionError, type ActionResult } from "@/lib/errors";

/**
 * Enveloppe commune des Server Actions : relit la session (une action est un
 * point d'entrée HTTP public, jamais protégé par la seule interface), exécute
 * le service et convertit ses erreurs en message affichable.
 */
export async function runAction<T>(fn: (actor: CurrentUser) => Promise<T>): Promise<ActionResult<T>> {
  const actor = await getCurrentUser();
  if (!actor) return { ok: false, error: "Votre session a expiré. Reconnectez-vous." };
  try {
    return { ok: true, data: await fn(actor) };
  } catch (error) {
    return toActionError(error);
  }
}
