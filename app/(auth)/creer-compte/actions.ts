"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { toActionError, type ActionResult } from "@/lib/errors";
import { acceptInvitation, checkInvitation } from "@/lib/services/invitations";
import type { Role } from "@/lib/authz/policy";

/** Étape 1 : vérifie e-mail + code et renvoie le profil pour afficher le bon formulaire. */
export async function checkInvitationAction(
  input: unknown,
): Promise<ActionResult<{ email: string; role: Role; name: string }>> {
  try {
    return { ok: true, data: await checkInvitation(input) };
  } catch (error) {
    return toActionError(error);
  }
}

/** Étape 2 : crée le compte (profil imposé par l'invitation), puis ouvre la session. */
export async function createAccountAction(input: unknown): Promise<ActionResult> {
  let credentials: { email: string; password: string };
  try {
    credentials = await acceptInvitation(input);
  } catch (error) {
    return toActionError(error);
  }

  try {
    await auth.api.signInEmail({ body: credentials, headers: await headers() });
  } catch {
    // Compte bien créé : en cas d'échec de la connexion automatique, on passe par l'écran de connexion.
    redirect("/connexion?compte=cree");
  }
  redirect("/");
}
