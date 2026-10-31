/**
 * Réinitialise le mot de passe d'un compte existant, depuis le terminal.
 *
 *   npm run admin:reset-password -- --email adresse@exemple.com
 *
 * En attendant un canal d'envoi (e-mail/SMS) pour « mot de passe oublié ».
 * Le nouveau mot de passe est saisi de façon masquée, deux fois. Toutes les
 * sessions ouvertes du compte sont fermées et l'opération est inscrite au
 * journal d'audit (sans le mot de passe).
 */
import { randomUUID } from "node:crypto";
import { parseArgs } from "node:util";
import { hashPassword } from "better-auth/crypto";
import { recordAudit } from "@/lib/audit";
import { emailSchema, passwordSchema } from "@/lib/validation/users";
import { askNewPassword, connect, run } from "./cli";

run(async () => {
  const { values } = parseArgs({ options: { email: { type: "string" } } });
  const email = emailSchema.safeParse(values.email ?? "");
  if (!email.success) {
    console.error("Usage : npm run admin:reset-password -- --email adresse@exemple.com");
    process.exit(1);
  }

  const db = connect();
  try {
    // Vérifie le compte avant de demander le mot de passe.
    const user = await db.user.findUnique({
      where: { email: email.data },
      select: { id: true, name: true, role: true, active: true },
    });
    if (!user) throw new Error(`Aucun compte avec l'adresse ${email.data}.`);
    console.log(`Compte : ${user.name} (${user.role}${user.active ? "" : ", DÉSACTIVÉ"})`);

    const password = passwordSchema.parse(await askNewPassword());
    const hash = await hashPassword(password);

    const revoked = await db.$transaction(async (tx) => {
      const { count } = await tx.account.updateMany({
        where: { userId: user.id, providerId: "credential" },
        data: { password: hash },
      });
      if (count === 0) {
        await tx.account.create({
          data: { id: randomUUID(), accountId: user.id, providerId: "credential", userId: user.id, password: hash },
        });
      }
      const sessions = await tx.session.deleteMany({ where: { userId: user.id } });
      await recordAudit(tx, {
        actorId: null,
        action: "user.password_reset_cli",
        entityType: "user",
        entityId: user.id,
        after: { sessionsRevoked: sessions.count },
      });
      return sessions.count;
    });

    console.log(`Mot de passe mis à jour pour ${email.data}. Sessions fermées : ${revoked}.`);
    if (!user.active) console.log("Attention : ce compte est désactivé, la connexion restera refusée.");
  } finally {
    await db.$disconnect();
  }
});
