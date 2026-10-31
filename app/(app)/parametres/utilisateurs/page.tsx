import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import type { Role } from "@/lib/authz/policy";
import { listPendingInvitations } from "@/lib/services/invitations";
import { listUsers } from "@/lib/services/users";
import { Card, CardHeader, PageHeader } from "@/components/ui/primitives";
import { SettingsTabs } from "../settings-tabs";
import { InviteForm } from "./invite-form";
import { PendingInvitationRow } from "./pending-invitation-row";
import { UserAccessRow } from "./user-access-row";

export const metadata: Metadata = { title: "Utilisateurs" };

export default async function UtilisateursPage() {
  const actor = await requirePermission("users.manage");
  const [users, invitations] = await Promise.all([listUsers(actor), listPendingInvitations(actor)]);

  return (
    <>
      <PageHeader title="Paramètres" description="Comptes et profils d'accès à DIWAA Finance." />
      <SettingsTabs current="utilisateurs" showUsers />

      <div className="grid gap-4 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-4">
          <Card>
            <CardHeader title={`Utilisateurs (${users.length})`} subtitle="Profils d'accès et activation des comptes" />
            <ul className="divide-y divide-line">
              {users.map((u) => (
                <UserAccessRow
                  key={u.id}
                  user={{ id: u.id, name: u.name, email: u.email, role: u.role as Role, active: u.active, image: u.image }}
                  isSelf={u.id === actor.id}
                />
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title={`Invitations en attente (${invitations.length})`} subtitle="Codes envoyés et non encore utilisés" />
            {invitations.length === 0 ? (
              <p className="py-2 text-sm text-muted">Aucune invitation en attente.</p>
            ) : (
              <ul className="divide-y divide-line">
                {invitations.map((inv) => (
                  <PendingInvitationRow
                    key={inv.id}
                    invitation={{ ...inv, role: inv.role as Role, expiresAt: inv.expiresAt.toISOString() }}
                  />
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card className="self-start">
          <CardHeader
            title="Inviter une personne"
            subtitle="Vous fixez l'e-mail et le profil ; la personne crée elle-même son compte et son mot de passe avec le code reçu."
          />
          <InviteForm />
        </Card>
      </div>
    </>
  );
}
