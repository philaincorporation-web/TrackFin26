"use client";

import { useState, useTransition } from "react";
import { ROLE_LABELS, ROLES, type Role } from "@/lib/authz/policy";
import { Badge, Button, Select, cx } from "@/components/ui/primitives";
import { Avatar } from "@/components/ui/avatar";
import { updateUserAccessAction } from "./actions";

type Row = { id: string; name: string; email: string; role: Role; active: boolean; image: string | null };

export function UserAccessRow({ user, isSelf }: { user: Row; isSelf: boolean }) {
  const [role, setRole] = useState<Role>(user.role);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = (next: { role: Role; active: boolean }, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) {
      setRole(user.role);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await updateUserAccessAction({ userId: user.id, ...next });
      if (!result.ok) {
        setError(result.error);
        setRole(user.role);
      }
    });
  };

  const selectId = `role-${user.id}`;

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3.5">
      <Avatar name={user.name} src={user.image} size="md" className={cx(!user.active && "opacity-50 grayscale")} />
      <div className="min-w-0 flex-1">
        <p className={cx("truncate text-sm font-semibold", !user.active && "text-muted line-through")}>
          {user.name} {isSelf && <span className="font-normal text-muted">(vous)</span>}
        </p>
        <p className="truncate text-xs text-muted">{user.email}</p>
        {error && (
          <p role="alert" className="mt-1 text-xs font-medium text-danger-600">
            {error}
          </p>
        )}
      </div>

      {!user.active && <Badge tone="neutral">Désactivé</Badge>}

      {isSelf ? (
        <Badge tone="success">{ROLE_LABELS[user.role]}</Badge>
      ) : (
        <div className="flex w-full items-center gap-2 pl-14 sm:w-auto sm:pl-0">
          <label htmlFor={selectId} className="sr-only">
            Profil de {user.name}
          </label>
          <Select
            id={selectId}
            value={role}
            disabled={pending}
            className="h-9 min-w-0 flex-1 py-0 sm:w-60 sm:flex-none"
            onChange={(e) => {
              const next = e.target.value as Role;
              setRole(next);
              save(
                { role: next, active: user.active },
                `Changer le profil de ${user.name} en « ${ROLE_LABELS[next]} » ? Ses sessions seront fermées.`,
              );
            }}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            variant={user.active ? "secondary" : "primary"}
            pending={pending}
            className="h-9 px-4"
            onClick={() =>
              save(
                { role: user.role, active: !user.active },
                user.active
                  ? `Désactiver le compte de ${user.name} ? La personne sera déconnectée immédiatement.`
                  : undefined,
              )
            }
          >
            {user.active ? "Désactiver" : "Réactiver"}
          </Button>
        </div>
      )}
    </li>
  );
}
