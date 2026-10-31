"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema, type SignInInput } from "@/lib/validation/users";
import { FormMessage } from "@/components/ui/primitives";
import { AuthField, PasswordField, SubmitButton } from "@/components/auth/fields";
import { signInAction } from "./actions";

export function LoginForm() {
  const params = useSearchParams();
  const next = params.get("suite");
  const justCreated = params.get("compte") === "cree";
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({ resolver: zodResolver(signInSchema) });

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await signInAction(values, next);
      if (result && !result.ok) setServerError(result.error);
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {justCreated && !serverError && (
        <FormMessage tone="success">Votre compte est créé. Connectez-vous avec votre e-mail et votre mot de passe.</FormMessage>
      )}
      {serverError && <FormMessage tone="error">{serverError}</FormMessage>}

      <AuthField
        id="email"
        label="Adresse e-mail"
        type="email"
        autoComplete="email"
        inputMode="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <PasswordField
        id="password"
        label="Mot de passe"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />

      {/* Pas de réinitialisation par e-mail en bêta : canal de notification non encore choisi. */}
      <details className="text-sm">
        <summary className="cursor-pointer list-none font-semibold text-pine-900 hover:underline [&::-webkit-details-marker]:hidden">
          Mot de passe oublié ?
        </summary>
        <p className="mt-2 rounded-xl bg-sand px-3 py-2.5 text-zinc-600">
          Contactez l&apos;administrateur général de DigiWomen School pour rétablir votre accès.
        </p>
      </details>

      <SubmitButton pending={pending}>Se connecter</SubmitButton>

      <p className="text-center text-sm text-zinc-600">
        Pas encore de compte ?{" "}
        <Link href="/creer-compte" className="font-semibold text-pine-900 underline-offset-4 hover:underline">
          Créer mon compte
        </Link>
      </p>
    </form>
  );
}
