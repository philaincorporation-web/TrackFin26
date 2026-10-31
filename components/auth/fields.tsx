"use client";

import { forwardRef, useState, type ComponentProps, type ReactNode } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { cx } from "@/components/ui/primitives";

const inputClass =
  "block h-12 w-full border-0 border-b border-zinc-300 bg-transparent px-0 text-base text-ink placeholder:text-zinc-400 read-only:text-zinc-500 focus:border-pine-800 focus:outline-none focus-visible:outline-none aria-invalid:border-danger-600";

type AuthFieldProps = ComponentProps<"input"> & {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
};

/** Champ souligné des pages d'entrée, avec libellé, aide et erreur accessibles. */
export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(function AuthField(
  { id, label, error, hint, optional, className, ...props },
  ref,
) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-zinc-500">
        {label}
        {optional && <span className="font-normal text-zinc-400"> (facultatif)</span>}
      </label>
      <input
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cx(inputClass, className)}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs font-medium text-danger-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1 text-xs text-zinc-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
});

/** Mot de passe avec bouton afficher / masquer. */
export const PasswordField = forwardRef<HTMLInputElement, Omit<AuthFieldProps, "type">>(function PasswordField(
  props,
  ref,
) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <AuthField ref={ref} {...props} type={visible ? "text" : "password"} className="pr-11" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        aria-pressed={visible}
        aria-controls={props.id}
        className="absolute right-0 top-5 grid size-11 place-items-center text-zinc-500 hover:text-ink"
      >
        {visible ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
      </button>
    </div>
  );
});

export function SubmitButton({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-pine-800 text-sm font-semibold uppercase tracking-wider text-sand-light shadow-lg shadow-pine-900/25 transition-colors hover:bg-pine-900 disabled:opacity-70"
    >
      {pending && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
      {children}
    </button>
  );
}
