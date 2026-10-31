/**
 * Ne conserve qu'un chemin interne à l'application (empêche les redirections
 * ouvertes du type ?suite=https://site-malveillant ou ?suite=//site).
 */
export function safeRedirectPath(value: string | null | undefined, fallback = "/"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(value)) return fallback;
  return value;
}
