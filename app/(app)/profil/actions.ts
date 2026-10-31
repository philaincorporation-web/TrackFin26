"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/actions";
import { removeOwnAvatar, updateOwnAvatar } from "@/lib/services/profile";

/** La photo s'affiche dans le menu et la barre supérieure : on rafraîchit tout l'espace connecté. */
export async function updateAvatarAction(formData: FormData) {
  const result = await runAction((actor) => updateOwnAvatar(actor, formData.get("photo")));
  if (result.ok) revalidatePath("/", "layout");
  return result;
}

export async function removeAvatarAction() {
  const result = await runAction((actor) => removeOwnAvatar(actor));
  if (result.ok) revalidatePath("/", "layout");
  return result;
}
