"use client";

import { useState, useTransition } from "react";
import { ROLE_LABELS, type Role } from "@/lib/authz/policy";
import { Button } from "@/components/ui/primitives";
import { revokeInvitationAction } from "./actions";

const formatDate = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: "Africa/Libreville" });

export function PendingInvitationRow({
  invitation,
}: {
  invitation: { id: string; email: string; role: Role; name: string | null; expiresAt: string };
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
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
      <Button
        type="button"
        variant="ghost"
        pending={pending}
        className="h-9 px-4"
        onClick={() => {
          if (!window.confirm(`Révoquer l'invitation de ${invitation.email} ? Le code ne fonctionnera plus.`)) return;
          setError(null);
          startTransition(async () => {
            const result = await revokeInvitationAction(invitation.id);
            if (!result.ok) setError(result.error);
          });
        }}
      >
        Révoquer
      </Button>
    </li>
  );
}
