"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy } from "lucide-react";
import { ROLE_LABELS, ROLES, type Role } from "@/lib/authz/policy";
import { createInvitationSchema, type CreateInvitationInput } from "@/lib/validation/signup";
import { Button, Field, FormMessage, Input, Select, invalidProps } from "@/components/ui/primitives";
import { createInvitationAction } from "./actions";

type Created = { email: string; role: Role; code: string; expiresAt: string; link: string };

const formatDate = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Africa/Libreville" });

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium hover:bg-canvas"
    >
      {copied ? <Check aria-hidden className="size-3.5 text-brand-600" /> : <Copy aria-hidden className="size-3.5" />}
      {copied ? "Copié" : label}
    </button>
  );
}

/** Résultat affiché une seule fois : le code n'est plus consultable ensuite. */
function InvitationResult({ created, onClose }: { created: Created; onClose: () => void }) {
  const until = formatDate.format(new Date(created.expiresAt));
  const message =
    `Bonjour, votre accès à DIWAA Finance (DigiWomen School) est prêt.\n` +
    `Profil : ${ROLE_LABELS[created.role]}\n` +
    `Créez votre compte ici : ${created.link}\n` +
    `Identifiant : ${created.email}\nCode d'invitation : ${created.code} (valable jusqu'au ${until})`;

  return (
    <div className="space-y-4" role="status">
      <FormMessage tone="success">
        Invitation créée pour {created.email} ({ROLE_LABELS[created.role]}).
      </FormMessage>
      <div className="rounded-xl border border-line p-4">
        <p className="text-xs font-medium text-muted">Code d&apos;invitation</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="font-mono text-2xl font-bold tracking-widest">{created.code}</p>
          <CopyButton value={created.code} label="Copier" />
        </div>
        <p className="mt-2 text-xs text-muted">Valable jusqu&apos;au {until}. Il ne sera plus affiché après fermeture.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <CopyButton value={created.link} label="Copier le lien" />
        <CopyButton value={message} label="Copier le message complet" />
      </div>
      <p className="text-xs text-muted">
        Transmettez-le par un canal sûr (WhatsApp, e-mail, de vive voix). La personne choisira elle-même son mot de
        passe.
      </p>
      <Button type="button" variant="secondary" className="w-full" onClick={onClose}>
        Inviter une autre personne
      </Button>
    </div>
  );
}

export function InviteForm() {
  const [created, setCreated] = useState<Created | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateInvitationInput>({
    resolver: zodResolver(createInvitationSchema),
    defaultValues: { role: "COLLABORATEUR" },
  });

  if (created) {
    return (
      <InvitationResult
        created={created}
        onClose={() => {
          setCreated(null);
          reset({ email: "", name: "", role: "COLLABORATEUR" });
        }}
      />
    );
  }

  const onSubmit = handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      const result = await createInvitationAction(values);
      if (result.ok && result.data) setCreated(result.data);
      else if (!result.ok) setError(result.error);
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {error && <FormMessage tone="error">{error}</FormMessage>}
      <Field id="inv-email" label="Adresse e-mail" error={errors.email?.message} hint="Ce sera son identifiant de connexion.">
        <Input id="inv-email" type="email" autoComplete="off" {...invalidProps("inv-email", errors.email?.message)} {...register("email")} />
      </Field>
      <Field id="inv-name" label="Nom (facultatif)" error={errors.name?.message} hint="Pré-remplit son formulaire.">
        <Input id="inv-name" autoComplete="off" {...register("name")} />
      </Field>
      <Field id="inv-role" label="Profil" error={errors.role?.message}>
        <Select id="inv-role" {...register("role")}>
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </Select>
      </Field>
      <Button type="submit" pending={pending} className="w-full">
        Générer l&apos;invitation
      </Button>
    </form>
  );
}
