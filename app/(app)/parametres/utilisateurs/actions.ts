"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/actions";
import { createInvitation, revokeInvitation } from "@/lib/services/invitations";
import { updateUserAccess } from "@/lib/services/users";

/** URL publique de l'application, pour le lien d'invitation. */
async function appOrigin() {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL.replace(/\/$/, "");
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}

export async function createInvitationAction(input: unknown) {
  const result = await runAction(async (actor) => {
    const inv = await createInvitation(actor, input);
    const link = `${await appOrigin()}/creer-compte?${new URLSearchParams({ email: inv.email, code: inv.code })}`;
    return { email: inv.email, role: inv.role, code: inv.code, expiresAt: inv.expiresAt.toISOString(), link };
  });
  if (result.ok) revalidatePath("/parametres/utilisateurs");
  return result;
}

export async function revokeInvitationAction(invitationId: string) {
  const result = await runAction(async (actor) => {
    await revokeInvitation(actor, invitationId);
  });
  if (result.ok) revalidatePath("/parametres/utilisateurs");
  return result;
}

export async function updateUserAccessAction(input: unknown) {
  const result = await runAction(async (actor) => {
    await updateUserAccess(actor, input);
  });
  if (result.ok) revalidatePath("/parametres/utilisateurs");
  return result;
}
