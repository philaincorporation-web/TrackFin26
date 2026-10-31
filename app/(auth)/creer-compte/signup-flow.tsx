"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CircleCheck } from "lucide-react";
import type { Role } from "@/lib/authz/policy";
import {
  invitationLookupSchema,
  signupSchemaFor,
  SIGNUP_PROFILES,
  type InvitationLookupInput,
  type SignupInput,
} from "@/lib/validation/signup";
import { PASSWORD_MIN } from "@/lib/validation/users";
import { FormMessage } from "@/components/ui/primitives";
import { AuthField, PasswordField, SubmitButton } from "@/components/auth/fields";
import { checkInvitationAction, createAccountAction } from "./actions";

type Invitation = { email: string; code: string; role: Role; name: string };

function StepHeader({ step, title, intro }: { step: 1 | 2; title: string; intro: string }) {
  return (
    <div className="mt-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pine-700">Étape {step} sur 2</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-pine-900 sm:text-3xl">{title}</h1>
      <p className="mt-1 text-sm text-zinc-600">{intro}</p>
    </div>
  );
}

/** Étape 1 : e-mail + code d'invitation (pré-remplis si la personne a reçu un lien). */
function InvitationStep({ onValid }: { onValid: (inv: Invitation) => void }) {
  const params = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InvitationLookupInput>({
    resolver: zodResolver(invitationLookupSchema),
    defaultValues: { email: params.get("email") ?? "", code: params.get("code") ?? "" },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await checkInvitationAction(values);
      if (result.ok && result.data) onValid({ ...result.data, code: values.code });
      else if (!result.ok) setServerError(result.error);
    });
  });

  return (
    <>
      <StepHeader
        step={1}
        title="Créer mon compte"
        intro="Saisissez l'adresse e-mail et le code d'invitation transmis par l'administrateur de DigiWomen School."
      />
      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-6">
        {serverError && <FormMessage tone="error">{serverError}</FormMessage>}
        <AuthField
          id="email"
          label="Adresse e-mail (votre identifiant)"
          type="email"
          autoComplete="email"
          inputMode="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <AuthField
          id="code"
          label="Code d'invitation"
          autoComplete="one-time-code"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="K7P4-M2QX"
          className="font-mono uppercase tracking-widest"
          error={errors.code?.message}
          hint="8 caractères, valable 7 jours."
          {...register("code")}
        />
        <SubmitButton pending={pending}>Continuer</SubmitButton>
        <p className="text-center text-sm text-zinc-600">
          Pas de code ? Demandez une invitation à l&apos;administrateur général.
        </p>
      </form>
    </>
  );
}

/** Étape 2 : formulaire propre au profil défini par l'invitation. */
function ProfileStep({ invitation, onBack }: { invitation: Invitation; onBack: () => void }) {
  const profile = SIGNUP_PROFILES[invitation.role];
  const schema = useMemo(() => signupSchemaFor(invitation.role), [invitation.role]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(schema),
    defaultValues: { email: invitation.email, code: invitation.code, name: invitation.name },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await createAccountAction({ ...values, email: invitation.email, code: invitation.code });
      if (result && !result.ok) setServerError(result.error);
    });
  });

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-pine-900"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Modifier l&apos;e-mail ou le code
      </button>
      <StepHeader step={2} title={profile.title} intro={profile.intro} />

      <div className="mt-6 rounded-2xl bg-sand px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-pine-700">Avec ce compte, vous pourrez</p>
        <ul className="mt-2 space-y-1.5">
          {profile.capabilities.map((c) => (
            <li key={c} className="flex items-start gap-2 text-sm text-zinc-700">
              <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-pine-700" />
              {c}
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-6">
        {serverError && <FormMessage tone="error">{serverError}</FormMessage>}

        <AuthField id="signup-email" label="Identifiant (adresse e-mail)" value={invitation.email} readOnly />

        <div className="grid gap-6 sm:grid-cols-2">
          <AuthField
            id="name"
            label="Nom complet"
            autoComplete="name"
            error={errors.name?.message}
            {...register("name")}
          />
          <AuthField
            id="phone"
            label="Téléphone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            optional
            error={errors.phone?.message}
            {...register("phone")}
          />
        </div>

        {profile.jobTitle.show && (
          <AuthField
            id="jobTitle"
            label={profile.jobTitle.label}
            placeholder={profile.jobTitle.placeholder}
            autoComplete="organization-title"
            optional={!profile.jobTitle.required}
            error={errors.jobTitle?.message}
            {...register("jobTitle")}
          />
        )}

        <PasswordField
          id="password"
          label="Créer un mot de passe"
          autoComplete="new-password"
          hint={`${PASSWORD_MIN} caractères minimum.`}
          error={errors.password?.message}
          {...register("password")}
        />
        <PasswordField
          id="passwordConfirm"
          label="Confirmer le mot de passe"
          autoComplete="new-password"
          error={errors.passwordConfirm?.message}
          {...register("passwordConfirm")}
        />

        <SubmitButton pending={pending}>Créer mon compte</SubmitButton>
      </form>
    </>
  );
}

export function SignupFlow() {
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  return (
    <>
      {invitation ? (
        <ProfileStep invitation={invitation} onBack={() => setInvitation(null)} />
      ) : (
        <InvitationStep onValid={setInvitation} />
      )}
      <p className="mt-6 text-center text-sm text-zinc-600">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="font-semibold text-pine-900 underline-offset-4 hover:underline">
          Se connecter
        </Link>
      </p>
    </>
  );
}
