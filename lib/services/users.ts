import "server-only";
import { db } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { assertCan, type Actor } from "@/lib/authz/policy";
import { BusinessError } from "@/lib/errors";
import { updateUserAccessSchema } from "@/lib/validation/users";

export async function listUsers(actor: Actor) {
  assertCan(actor, "users.manage");
  return db.user.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true, active: true, jobTitle: true, image: true, createdAt: true },
  });
}

/** Changement de rôle et/ou activation d'un compte. */
export async function updateUserAccess(actor: Actor, input: unknown) {
  assertCan(actor, "users.manage");
  const data = updateUserAccessSchema.parse(input);
  if (data.userId === actor.id) {
    throw new BusinessError("Vous ne pouvez pas modifier vos propres accès. Demandez à un autre administrateur.");
  }

  return db.$transaction(async (tx) => {
    const before = await tx.user.findUnique({
      where: { id: data.userId },
      select: { id: true, role: true, active: true },
    });
    if (!before) throw new BusinessError("Utilisateur introuvable.");
    if (before.role === data.role && before.active === data.active) return before;

    const losesAdmin = before.role === "ADMIN" && before.active && (data.role !== "ADMIN" || !data.active);
    if (losesAdmin) {
      const activeAdmins = await tx.user.count({ where: { role: "ADMIN", active: true } });
      if (activeAdmins <= 1) throw new BusinessError("Il doit rester au moins un administrateur actif.");
    }

    const after = await tx.user.update({
      where: { id: data.userId },
      data: { role: data.role, active: data.active },
      select: { id: true, role: true, active: true },
    });
    // Force une reconnexion : les nouvelles permissions s'appliquent immédiatement.
    await tx.session.deleteMany({ where: { userId: data.userId } });

    await recordAudit(tx, {
      actorId: actor.id,
      action: before.active !== after.active ? (after.active ? "user.activate" : "user.deactivate") : "user.role_change",
      entityType: "user",
      entityId: after.id,
      before: { role: before.role, active: before.active },
      after: { role: after.role, active: after.active },
    });
    return after;
  });
}
