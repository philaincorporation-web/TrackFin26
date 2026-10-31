import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import type { Prisma } from "@/generated/prisma/client";
import type { Role } from "@/lib/authz/policy";

/**
 * Création d'un compte au format attendu par Better Auth : un `user` et un
 * `account` de type « credential » dont `accountId` = id de l'utilisateur, avec
 * le mot de passe haché (scrypt). Partagé par le service d'invitations et par
 * scripts/create-admin.ts, d'où l'absence de "server-only".
 */
export async function insertUserWithPassword(
  tx: Prisma.TransactionClient,
  data: { name: string; email: string; role: Role; password: string; phone?: string | null; jobTitle?: string | null },
) {
  const id = randomUUID();
  const password = await hashPassword(data.password);
  const user = await tx.user.create({
    data: {
      id,
      name: data.name,
      email: data.email,
      role: data.role,
      phone: data.phone || null,
      jobTitle: data.jobTitle || null,
    },
    select: { id: true, name: true, email: true, role: true, active: true },
  });
  await tx.account.create({
    data: { id: randomUUID(), accountId: id, providerId: "credential", userId: id, password },
  });
  return user;
}
