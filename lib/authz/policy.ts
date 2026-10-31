/**
 * Matrice des permissions de DIWAA Finance — SEUL point de décision d'accès.
 * Source : docs/01-ARCHITECTURE.md §3. Toute évolution doit être répercutée
 * dans ce fichier, dans la documentation et dans tests/unit/policy.test.ts.
 *
 * Ce module est pur (aucun accès réseau ni base) afin d'être testable ligne
 * par ligne. Les services l'appellent systématiquement côté serveur : masquer
 * un bouton dans l'interface n'est jamais une mesure de sécurité.
 */

export const ROLES = ["DIRECTRICE", "ADMIN", "SECRETAIRE", "COLLABORATEUR"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  DIRECTRICE: "Directrice générale",
  ADMIN: "Administrateur général",
  SECRETAIRE: "Secrétaire",
  COLLABORATEUR: "Collaborateur",
};

/** `all` = sur tous les objets · `own` = uniquement sur ses propres objets. */
export type Scope = "all" | "own";

const ALL = "all" as const;
const OWN = "own" as const;

export const POLICY = {
  // Pilotage
  "dashboard.view": { DIRECTRICE: ALL, ADMIN: ALL, SECRETAIRE: ALL },
  "report.read": { DIRECTRICE: ALL, ADMIN: ALL, SECRETAIRE: ALL },
  "audit.read": { DIRECTRICE: ALL, ADMIN: ALL, SECRETAIRE: ALL },

  // Dépenses
  "expense.create": { SECRETAIRE: ALL, COLLABORATEUR: OWN },
  "expense.read": { DIRECTRICE: ALL, ADMIN: ALL, SECRETAIRE: ALL, COLLABORATEUR: OWN },
  "expense.review": { SECRETAIRE: ALL }, // valider, demander une précision, rejeter
  "expense.adminConfirm": { ADMIN: ALL }, // confirmation facultative, non bloquante
  "expense.post": { SECRETAIRE: ALL }, // comptabiliser
  "expense.addAttachment": { SECRETAIRE: ALL, COLLABORATEUR: OWN },
  "file.read": { DIRECTRICE: ALL, ADMIN: ALL, SECRETAIRE: ALL, COLLABORATEUR: OWN },

  // Annotations
  "comment.create": { DIRECTRICE: ALL, ADMIN: ALL, SECRETAIRE: ALL, COLLABORATEUR: OWN },

  // Factures et encaissements
  "invoice.read": { DIRECTRICE: ALL, ADMIN: ALL, SECRETAIRE: ALL },
  "invoice.manage": { SECRETAIRE: ALL }, // créer, émettre, encaisser, annuler

  // Trésorerie déclarée
  "treasury.read": { DIRECTRICE: ALL, ADMIN: ALL, SECRETAIRE: ALL },
  "treasury.update": { SECRETAIRE: ALL },

  // Personnel et paie
  "employee.read": { DIRECTRICE: ALL, ADMIN: ALL, SECRETAIRE: ALL },
  "employee.manage": { SECRETAIRE: ALL },
  "payroll.prepare": { SECRETAIRE: ALL },
  "payroll.validate": { DIRECTRICE: ALL, ADMIN: ALL },
  "salaryPayment.read": { DIRECTRICE: ALL, ADMIN: ALL, SECRETAIRE: ALL },
  "salaryPayment.create": { SECRETAIRE: ALL },
  "payslip.readOwn": { DIRECTRICE: OWN, ADMIN: OWN, SECRETAIRE: OWN, COLLABORATEUR: OWN },

  // Paramètres et utilisateurs
  "settings.read": { DIRECTRICE: ALL, ADMIN: ALL },
  "settings.manage": { ADMIN: ALL },
  "users.manage": { ADMIN: ALL },

  // Profil personnel (photo, coordonnées) : chacun le sien uniquement
  "profile.manageOwn": { DIRECTRICE: OWN, ADMIN: OWN, SECRETAIRE: OWN, COLLABORATEUR: OWN },

  // Notifications (chacun ne reçoit que les siennes)
  "notification.read": { DIRECTRICE: OWN, ADMIN: OWN, SECRETAIRE: OWN, COLLABORATEUR: OWN },
} as const satisfies Record<string, Partial<Record<Role, Scope>>>;

export type Action = keyof typeof POLICY;

export type Actor = { id: string; role: Role };

/** Objet ciblé : `ownerId` est l'utilisateur propriétaire (déclarant, salarié…). */
export type Resource = { ownerId: string | null | undefined };

/** Portée accordée à un rôle pour une action, ou `null` si aucune. */
export function scopeOf(role: Role, action: Action): Scope | null {
  const rules: Partial<Record<Role, Scope>> = POLICY[action];
  return rules[role] ?? null;
}

/**
 * Autorisation pour une action.
 * - sans `resource` : vrai si le rôle dispose d'une portée quelconque (ex. accès
 *   à une liste, que le service filtrera ensuite selon `scopeOf`) ;
 * - avec `resource` : une portée `own` exige que l'acteur en soit propriétaire.
 */
export function can(actor: Actor, action: Action, resource?: Resource): boolean {
  const scope = scopeOf(actor.role, action);
  if (!scope) return false;
  if (scope === "all" || resource === undefined) return true;
  return !!resource.ownerId && resource.ownerId === actor.id;
}

export class ForbiddenError extends Error {
  constructor(public readonly action: Action) {
    super(`Action non autorisée : ${action}`);
    this.name = "ForbiddenError";
  }
}

export function assertCan(actor: Actor, action: Action, resource?: Resource): void {
  if (!can(actor, action, resource)) throw new ForbiddenError(action);
}
