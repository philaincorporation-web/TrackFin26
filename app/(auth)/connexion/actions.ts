"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import type { ActionResult } from "@/lib/errors";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { signInSchema } from "@/lib/validation/users";

export async function signInAction(input: unknown, next?: string | null): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Adresse e-mail ou mot de passe incorrect." };

  try {
    await auth.api.signInEmail({ body: parsed.data, headers: await headers() });
  } catch {
    // Message volontairement identique dans tous les cas (compte inconnu,
    // mot de passe faux, compte désactivé) pour ne rien révéler.
    return { ok: false, error: "Adresse e-mail ou mot de passe incorrect, ou compte désactivé." };
  }
  redirect(safeRedirectPath(next));
}

export async function signOutAction(): Promise<void> {
  await auth.api.signOut({ headers: await headers() });
  redirect("/connexion");
}
