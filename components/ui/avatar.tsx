import { cx } from "@/components/ui/primitives";

const SIZES = {
  sm: "size-9 text-xs",
  md: "size-11 text-sm",
  lg: "size-14 text-base",
  xl: "size-28 text-3xl",
} as const;

const PALETTE = ["bg-pine-700", "bg-brand-600", "bg-accent-600", "bg-amber-700", "bg-sky-700", "bg-rose-700"];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

/** Couleur stable par personne, pour distinguer les initiales. */
function colorFor(name: string) {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

/**
 * Photo de profil, ou initiales sur fond coloré. Balise <img> simple : la
 * photo est servie par une route authentifiée que l'optimiseur d'images de
 * Next (sans cookie) ne pourrait pas lire.
 */
export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const base = cx("inline-grid shrink-0 place-items-center overflow-hidden rounded-full", SIZES[size], className);
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={cx(base, "object-cover")} />;
  }
  return (
    <span aria-hidden className={cx(base, colorFor(name), "font-semibold text-white")}>
      {initials(name)}
    </span>
  );
}
