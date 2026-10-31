import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { can } from "@/lib/authz/policy";
import { getSettingsForEdit } from "@/lib/services/settings";
import { Card, PageHeader } from "@/components/ui/primitives";
import { SettingsTabs } from "../settings-tabs";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Paramètres de l'entreprise" };

export default async function EntreprisePage() {
  const user = await requirePermission("settings.read");
  const settings = await getSettingsForEdit(user);
  const editable = can(user, "settings.manage");

  return (
    <>
      <PageHeader
        title="Paramètres"
        description="Informations de DigiWomen School reprises sur les factures, reçus et bulletins."
      />
      <SettingsTabs current="entreprise" showUsers={can(user, "users.manage")} />
      <Card className="max-w-3xl">
        <SettingsForm
          editable={editable}
          lastUpdate={settings.updatedAt?.toISOString() ?? null}
          defaults={{
            legalName: settings.legalName,
            address: settings.address ?? "",
            phone: settings.phone ?? "",
            email: settings.email ?? "",
            rccm: settings.rccm ?? "",
            nif: settings.nif ?? "",
            bankDetails: settings.bankDetails ?? "",
            currency: settings.currency,
            invoicePrefix: settings.invoicePrefix,
            invoicePadding: settings.invoicePadding,
            payrollPortalEnabled: settings.payrollPortalEnabled,
          }}
        />
      </Card>
    </>
  );
}
