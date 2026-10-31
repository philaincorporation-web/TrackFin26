"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/actions";
import { updateCompanySettings } from "@/lib/services/settings";

export async function updateSettingsAction(input: unknown) {
  const result = await runAction(async (actor) => {
    await updateCompanySettings(actor, input);
  });
  if (result.ok) revalidatePath("/parametres/entreprise");
  return result;
}
