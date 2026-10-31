import "server-only";
import { db } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { assertCan, type Actor } from "@/lib/authz/policy";
import { companySettingsSchema } from "@/lib/validation/settings";

const SETTINGS_ID = 1;

/** Valeurs par défaut tant que les paramètres n'ont jamais été enregistrés. */
const DEFAULTS = {
  legalName: "DigiWomen School",
  address: null,
  phone: null,
  email: null,
  rccm: null,
  nif: null,
  bankDetails: null,
  currency: "XAF",
  invoicePrefix: "FAC",
  invoicePadding: 3,
  payrollPortalEnabled: false,
  updatedAt: null as Date | null,
};

/**
 * Lecture interne sans contrôle de rôle : les paramètres servent aussi aux PDF
 * et aux numéros de facture. L'écran de paramètres passe par getSettingsForEdit.
 */
export async function getCompanySettings() {
  const row = await db.companySettings.findUnique({ where: { id: SETTINGS_ID } });
  return row ?? DEFAULTS;
}

export async function getSettingsForEdit(actor: Actor) {
  assertCan(actor, "settings.read");
  return getCompanySettings();
}

export async function updateCompanySettings(actor: Actor, input: unknown) {
  assertCan(actor, "settings.manage");
  const data = companySettingsSchema.parse(input);

  return db.$transaction(async (tx) => {
    const before = await tx.companySettings.findUnique({ where: { id: SETTINGS_ID } });
    const after = await tx.companySettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...data, updatedById: actor.id },
      update: { ...data, updatedById: actor.id },
    });
    await recordAudit(tx, {
      actorId: actor.id,
      action: "settings.update",
      entityType: "company_settings",
      entityId: String(SETTINGS_ID),
      before,
      after,
    });
    return after;
  });
}
