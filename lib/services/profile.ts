import "server-only";
import { db } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { assertCan, type Actor } from "@/lib/authz/policy";
import { normalizeAvatar } from "@/lib/avatar/process";
import { BusinessError } from "@/lib/errors";

export async function getOwnProfile(actor: Actor) {
  assertCan(actor, "profile.manageOwn", { ownerId: actor.id });
  return db.user.findUniqueOrThrow({
    where: { id: actor.id },
    select: { name: true, email: true, role: true, image: true, phone: true, jobTitle: true, createdAt: true },
  });
}

/**
 * Remplace la photo de profil de l'utilisateur connecté (jamais celle d'un
 * autre : l'identifiant vient de la session, pas du formulaire).
 */
export async function updateOwnAvatar(actor: Actor, file: unknown) {
  assertCan(actor, "profile.manageOwn", { ownerId: actor.id });
  if (!(file instanceof File)) throw new BusinessError("Aucune photo reçue.");
  const { data, mimeType } = await normalizeAvatar(new Uint8Array(await file.arrayBuffer()));

  const version = Date.now().toString(36);
  const image = `/api/avatar/${actor.id}?v=${version}`;
  await db.$transaction(async (tx) => {
    await tx.userAvatar.upsert({
      where: { userId: actor.id },
      create: { userId: actor.id, data, mimeType },
      update: { data, mimeType },
    });
    await tx.user.update({ where: { id: actor.id }, data: { image } });
    await recordAudit(tx, {
      actorId: actor.id,
      action: "user.avatar_update",
      entityType: "user",
      entityId: actor.id,
      after: { bytes: data.length, mimeType }, // jamais l'image elle-même
    });
  });
  return image;
}

export async function removeOwnAvatar(actor: Actor) {
  assertCan(actor, "profile.manageOwn", { ownerId: actor.id });
  await db.$transaction(async (tx) => {
    await tx.userAvatar.deleteMany({ where: { userId: actor.id } });
    await tx.user.update({ where: { id: actor.id }, data: { image: null } });
    await recordAudit(tx, { actorId: actor.id, action: "user.avatar_remove", entityType: "user", entityId: actor.id });
  });
}
