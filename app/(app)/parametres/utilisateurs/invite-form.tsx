"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, MailWarning } from "lucide-react";
import { ROLE_LABELS, ROLES } from "@/lib/authz/policy";
import { createInvitationSchema, type CreateInvitationInput } from "@/lib/validation/signup";
import { Button, Field, FormMessage, Input, Select, invalidProps } from "@/components/ui/primitives";
import { createInvitationAction, type InvitationOutcome } from "./actions";

type Created = InvitationOutcome;

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
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium hover:bg-canvas-soft"
    >
      {copied ? <Check aria-hidden className="size-3.5 text-brand-600" /> : <Copy aria-hidden className="size-3.5" />}
      {copied ? "Copié" : label}
    </button>
  );
}

/** Code, lien et message prêts à transmettre à la main. */
function ManualShare({ created }: { created: Created }) {
  const until = formatDate.format(new Date(created.expiresAt));
  const message =
    `Bonjour, votre accès à DIWAA Finance (DigiWomen School) est prêt.
` +
    `Profil : ${ROLE_LABELS[created.role]}
` +
    `Créez votre compte ici : ${created.link}
` +
    `Identifiant : ${created.email}
Code d'invitation : ${created.code} (valable jusqu'au ${until})`;
  return (
    <div className="space-y-3">
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
    </div>
  );
}

/**
 * Résultat d'une invitation (création ou renvoi). E-mail parti : confirmation,
 * code replié en secours. Échec d'envoi : raison + code et lien à transmettre.
 */
export function InvitationResult({ created, onClose, closeLabel }: { created: Created; onClose: () => void; closeLabel: string }) {
  return (
    <div className="space-y-4">
      {created.emailSent ? (
        <FormMessage tone="success">
          Invitation envoyée par e-mail à <strong>{created.email}</strong> ({ROLE_LABELS[created.role]}). La personne
          crée son compte depuis le lien reçu.
        </FormMessage>
      ) : (
        <div role="alert" className="flex items-start gap-2 rounded-xl bg-warning-50 px-3 py-2.5 text-sm text-warning-700">
          <MailWarning aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>
            Invitation créée, mais <strong>l&apos;e-mail n&apos;a pas été envoyé</strong> : {created.emailError} Transmettez
            le code ou le lien ci-dessous par un canal sûr (WhatsApp, de vive voix).
          </span>
        </div>
      )}

      {created.emailSent ? (
        <details className="rounded-xl border border-line px-4 py-3 text-sm">
          <summary className="cursor-pointer font-medium text-zinc-700">L&apos;e-mail n&apos;arrive pas ? Afficher le code</summary>
          <div className="mt-3">
            <ManualShare created={created} />
          </div>
        </details>
      ) : (
        <ManualShare created={created} />
      )}

      <Button type="button" variant="secondary" className="w-full" onClick={onClose}>
        {closeLabel}
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
        closeLabel="Inviter une autre personne"
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
      <Field id="inv-email" label="Adresse e-mail" error={errors.email?.message} hint="Son identifiant de connexion ; l&apos;invitation y est envoyée.">
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
        Envoyer l&apos;invitation
      </Button>
    </form>
  );
}
