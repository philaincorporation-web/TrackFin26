/**
 * Amorçage : crée le PREMIER compte Administrateur général.
 *
 *   npm run admin:create -- --name "Prénom Nom" --email adresse@exemple.com
 *
 * Le mot de passe est demandé de façon masquée (jamais en argument, pour ne pas
 * finir dans l'historique du terminal). Refuse de s'exécuter si un
 * administrateur actif existe déjà : les comptes suivants se créent depuis
 * l'application (Paramètres → Utilisateurs).
 */
import { parseArgs } from "node:util";
import { recordAudit } from "@/lib/audit";
import { insertUserWithPassword } from "@/lib/services/user-records";
import { createUserSchema } from "@/lib/validation/users";
import { askNewPassword, connect, run } from "./cli";

run(async () => {
  const { values } = parseArgs({ options: { name: { type: "string" }, email: { type: "string" } } });
  if (!values.name || !values.email) {
    console.error('Usage : npm run admin:create -- --name "Prénom Nom" --email adresse@exemple.com');
    process.exit(1);
  }

  const password = await askNewPassword();
  const data = createUserSchema.parse({ name: values.name, email: values.email, role: "ADMIN", password });
  const db = connect();

  try {
    const user = await db.$transaction(async (tx) => {
      const admins = await tx.user.count({ where: { role: "ADMIN", active: true } });
      if (admins > 0) throw new Error("Un administrateur actif existe déjà : créez les comptes depuis l'application.");
      if (await tx.user.findUnique({ where: { email: data.email } })) {
        throw new Error("Un compte existe déjà avec cette adresse e-mail.");
      }
      const created = await insertUserWithPassword(tx, data);
      await recordAudit(tx, {
        actorId: null,
        action: "user.bootstrap_admin",
        entityType: "user",
        entityId: created.id,
        after: { name: created.name, email: created.email, role: created.role },
      });
      return created;
    });
    console.log(`Administrateur créé : ${user.name} <${user.email}>`);
  } finally {
    await db.$disconnect();
  }
});
