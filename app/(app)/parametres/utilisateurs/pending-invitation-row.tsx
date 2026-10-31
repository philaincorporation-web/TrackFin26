"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { ROLE_LABELS, type Role } from "@/lib/authz/policy";
import { Button } from "@/components/ui/primitives";
import { resendInvitationAction, revokeInvitationAction, type InvitationOutcome } from "./actions";
import { InvitationResult } from "./invite-form";

const formatDate = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: "Africa/Libreville" });

export function PendingInvitationRow({
  invitation,
}: {
  invitation: { id: string; email: string; role: Role; name: string | null; expiresAt: string };
}) {
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState<InvitationOutcome | null>(null);
  const [pending, startTransition] = useTransition();

  const resend = () => {
    if (!window.confirm(`Renvoyer l'invitation à ${invitation.email} ? Un nouveau code sera envoyé ; l'ancien ne fonctionnera plus.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await resendInvitationAction(invitation.id);
      if (result.ok && result.data) setResent(result.data);
      else if (!result.ok) setError(result.error);
    });
  };

  const revoke = () => {
    if (!window.confirm(`Révoquer l'invitation de ${invitation.email} ? Le code ne fonctionnera plus.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await revokeInvitationAction(invitation.id);
      if (!result.ok) setError(result.error);
    });
  };

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{invitation.name || invitation.email}</p>
          <p className="truncate text-xs text-muted">
            {invitation.name ? `${invitation.email} · ` : ""}
            {ROLE_LABELS[invitation.role]} · expire le {formatDate.format(new Date(invitation.expiresAt))}
          </p>
          {error && (
            <p role="alert" className="mt-1 text-xs font-medium text-danger-600">
              {error}
            </p>
          )}
        </div>
        {!resent && (
          <div className="flex gap-1">
            <Button type="button" variant="secondary" pending={pending} className="h-9 px-4" onClick={resend}>
              <Send aria-hidden className="size-4" />
              Renvoyer
            </Button>
            <Button type="button" variant="ghost" disabled={pending} className="h-9 px-4" onClick={revoke}>
              Révoquer
            </Button>
          </div>
        )}
      </div>
      {resent && (
        <div className="mt-3">
          <InvitationResult created={resent} closeLabel="Fermer" onClose={() => setResent(null)} />
        </div>
      )}
    </li>
  );
}
