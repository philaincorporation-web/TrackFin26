"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/actions";
import { canonicalOrigin } from "@/lib/auth/origins";
import type { Actor } from "@/lib/authz/policy";
import {
  createInvitation,
  deliverInvitation,
  reissueInvitation,
  revokeInvitation,
  type IssuedInvitation,
} from "@/lib/services/invitations";
import { updateUserAccess } from "@/lib/services/users";

/** URL publique de l'application, pour le lien d'invitation. */
async function appOrigin() {
  const canonical = canonicalOrigin();
  if (canonical) return canonical;
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}

/** Envoie l'e-mail puis renvoie ce que l'écran affiche (le code reste visible en cas d'échec d'envoi). */
async function deliver(actor: Actor, inv: IssuedInvitation) {
  const { link, email } = await deliverInvitation(actor, inv, await appOrigin());
  return {
    email: inv.email,
    role: inv.role,
    code: inv.code,
    expiresAt: inv.expiresAt.toISOString(),
    link,
    emailSent: email.sent,
    emailError: email.sent ? null : email.reason,
  };
}

export type InvitationOutcome = Awaited<ReturnType<typeof deliver>>;

export async function createInvitationAction(input: unknown) {
  const result = await runAction(async (actor) => deliver(actor, await createInvitation(actor, input)));
  if (result.ok) revalidatePath("/parametres/utilisateurs");
  return result;
}

export async function resendInvitationAction(invitationId: string) {
  const result = await runAction(async (actor) => deliver(actor, await reissueInvitation(actor, invitationId)));
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
