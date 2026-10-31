import type { ComponentProps, ReactNode } from "react";
import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/** Marque du produit. L'entreprise (DigiWomen School) est affichée séparément. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cx("flex items-center gap-3", className)}>
      <span
        aria-hidden
        className="grid size-11 place-items-center rounded-2xl bg-pine-800 text-lg font-bold text-sand-light shadow-md shadow-pine-900/20"
      >
        D
      </span>
      <span className="leading-tight">
        <span className="block text-[17px] font-bold tracking-tight">DIWAA Finance</span>
        <span className="block text-xs text-muted">DigiWomen School</span>
      </span>
    </div>
  );
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  pending?: boolean;
};

export function Button({ variant = "primary", pending, disabled, className, children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={cx(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-pine-800 text-white shadow-md shadow-pine-900/15 hover:bg-pine-900",
        variant === "secondary" && "border border-line bg-surface text-ink hover:bg-canvas-soft",
        variant === "ghost" && "text-muted hover:bg-canvas-soft hover:text-ink",
        variant === "danger" && "bg-danger-600 text-white hover:bg-red-700",
        className,
      )}
    >
      {pending && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Card({
  className,
  tone = "light",
  children,
}: {
  className?: string;
  tone?: "light" | "dark";
  children: ReactNode;
}) {
  return (
    <section
      className={cx(
        "rounded-[var(--radius-card)] p-5 shadow-[0_1px_2px_rgba(16,24,16,0.04),0_8px_24px_-12px_rgba(16,24,16,0.10)] sm:p-6",
        tone === "dark" ? "bg-pine-800 text-white" : "bg-surface",
        className,
      )}
    >
      {children}
    </section>
  );
}

/** En-tête de carte : titre, sous-titre gris et action à droite (maquette). */
export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-zinc-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Pastille carrée arrondie contenant une icône. */
export function IconTile({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "dark" }) {
  return (
    <span
      aria-hidden
      className={cx(
        "grid size-12 shrink-0 place-items-center rounded-2xl",
        tone === "dark" ? "bg-white/95 text-pine-800" : "bg-canvas-soft text-zinc-700 ring-1 ring-line",
      )}
    >
      {children}
    </span>
  );
}

/** Étiquette d'état arrondie. */
export function Badge({ tone = "neutral", children }: { tone?: "success" | "neutral" | "danger" | "info"; children: ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        tone === "success" && "bg-brand-100 text-brand-700",
        tone === "neutral" && "bg-canvas-soft text-zinc-600 ring-1 ring-line",
        tone === "danger" && "bg-danger-50 text-danger-600",
        tone === "info" && "bg-accent-50 text-accent-700",
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[2rem] sm:leading-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-600">{description}</p>}
      </div>
      {actions}
    </header>
  );
}

const inputClass =
  "block h-11 w-full rounded-xl border border-line bg-canvas-soft/60 px-3.5 focus:border-pine-700 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-pine-700/15 text-sm text-ink placeholder:text-zinc-400 aria-invalid:border-danger-600 disabled:bg-canvas disabled:text-muted";

export function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}


/**
 * Retire du style par défaut la largeur / hauteur quand l'appelant en fournit
 * une : deux utilitaires contradictoires (ex. h-11 et h-9) ne se départagent
 * pas par leur ordre dans className.
 */
function withOverrides(base: string, className?: string) {
  if (!className) return base;
  const tokens = className.split(/\s+/);
  const has = (prefix: string) => tokens.some((t) => t.startsWith(prefix) || t.includes(`:${prefix}`));
  return base
    .split(" ")
    .filter((c) => !(c === "w-full" && (has("w-") || tokens.includes("flex-1"))) && !(c === "h-11" && has("h-")))
    .join(" ");
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input {...props} className={cx(withOverrides(inputClass, className), className)} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select {...props} className={cx(withOverrides(inputClass, className), "pr-8", className)} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  const cls = cx("h-auto min-h-24 py-2", className);
  return <textarea {...props} className={cx(withOverrides(inputClass, cls), cls)} />;
}

/** Message de formulaire annoncé aux lecteurs d'écran. */
export function FormMessage({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  const Icon = tone === "error" ? CircleAlert : CircleCheck;
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cx(
        "flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm",
        tone === "error" ? "bg-danger-50 text-danger-600" : "bg-brand-50 text-brand-700",
      )}
    >
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/** Aide aux attributs ARIA d'un champ en erreur. */
export function invalidProps(id: string, error?: string) {
  return error ? { "aria-invalid": true as const, "aria-describedby": `${id}-error` } : {};
}
