import { createHash, randomInt } from "node:crypto";

/**
 * Codes d'invitation : 8 caractères lisibles (sans 0/O, 1/I/L), affichés en
 * deux groupes « K7P4-M2QX ». ~40 bits d'aléa, liés à un e-mail précis, à
 * durée limitée et invalidés après quelques essais erronés.
 */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const LENGTH = 8;

export const INVITATION_TTL_DAYS = 7;
export const INVITATION_MAX_ATTEMPTS = 5;

export function generateInvitationCode(): string {
  let code = "";
  for (let i = 0; i < LENGTH; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/** Tolère minuscules, espaces et tirets à la saisie. */
export function normalizeInvitationCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isWellFormedInvitationCode(input: string): boolean {
  const code = normalizeInvitationCode(input);
  return code.length === LENGTH && [...code].every((c) => ALPHABET.includes(c));
}

/** Empreinte stockée en base : le code en clair n'est jamais conservé. */
export function hashInvitationCode(input: string): string {
  return createHash("sha256").update(normalizeInvitationCode(input)).digest("hex");
}
