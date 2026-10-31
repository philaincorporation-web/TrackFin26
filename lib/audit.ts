import type { Prisma } from "@/generated/prisma/client";

// Pas de "server-only" ici : ce module est aussi utilisé par scripts/create-admin.ts.
type Tx = Prisma.TransactionClient;

export type AuditInput = {
  actorId: string | null;
  action: string; // ex. "user.create", "settings.update", "expense.validate"
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
};

/** Rend une valeur sérialisable en JSON (BigInt → chaîne, Date → ISO). */
function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined;
  return JSON.parse(
    JSON.stringify(value, (_k, v) => (typeof v === "bigint" ? v.toString() : v)),
  ) as Prisma.InputJsonValue;
}

/**
 * Ajoute un événement au journal d'audit. Doit être appelé avec le client de
 * la transaction de l'opération auditée : l'événement et l'opération sont
 * alors validés ou annulés ensemble. La table refuse UPDATE/DELETE (trigger).
 */
export async function recordAudit(tx: Tx, event: AuditInput): Promise<void> {
  await tx.auditEvent.create({
    data: {
      actorId: event.actorId,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      before: toJson(event.before),
      after: toJson(event.after),
      ip: event.ip ?? null,
    },
  });
}
