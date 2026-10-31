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
import { config } from "dotenv";
import { parseArgs } from "node:util";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";
import { recordAudit } from "@/lib/audit";
import { insertUserWithPassword } from "@/lib/services/user-records";
import { createUserSchema } from "@/lib/validation/users";

config({ path: ".env.local", quiet: true, override: false });

// Tampon partagé : un bloc reçu peut contenir plusieurs saisies (collage,
// entrée redirigée), la suite est conservée pour la question suivante.
let buffer = "";

function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const { stdin, stdout } = process;
    stdout.write(question);

    const takeLine = () => {
      const end = buffer.search(/[\r\n\u0004]/);
      if (end < 0) return false;
      const value = buffer.slice(0, end);
      buffer = buffer.slice(end + 1).replace(/^\n/, "");
      stdin.setRawMode?.(false);
      stdin.pause();
      stdin.off("data", onData);
      stdout.write("\n");
      resolve(value);
      return true;
    };

    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === "\u0003") process.exit(130);
        else if (char === "\u007f" || char === "\b") buffer = buffer.slice(0, -1);
        else buffer += char;
      }
      takeLine();
    };

    if (takeLine()) return;
    stdin.setRawMode?.(true);
    stdin.setEncoding("utf8");
    stdin.on("data", onData);
    stdin.resume();
  });
}

async function main() {
  const { values } = parseArgs({ options: { name: { type: "string" }, email: { type: "string" } } });
  if (!values.name || !values.email) {
    console.error('Usage : npm run admin:create -- --name "Prénom Nom" --email adresse@exemple.com');
    process.exit(1);
  }

  const password = await askHidden("Mot de passe (10 caractères min.) : ");
  const confirm = await askHidden("Confirmez le mot de passe : ");
  if (password !== confirm) {
    console.error("Les mots de passe ne correspondent pas.");
    process.exit(1);
  }

  const data = createUserSchema.parse({ name: values.name, email: values.email, role: "ADMIN", password });
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL manquante (voir .env.example)");
  // Affiche la base visée (hôte uniquement, sans identifiants) avant toute écriture.
  console.log(`Base ciblée : ${new URL(connectionString).host} (branche ${process.env.NEON_BRANCH ?? "?"})`);
  const db = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });

  try {
    // Délai élargi : une base Neon en veille peut mettre quelques secondes à se réveiller.
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
    }, { maxWait: 15_000, timeout: 20_000 });
    console.log(`Administrateur créé : ${user.name} <${user.email}>`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
