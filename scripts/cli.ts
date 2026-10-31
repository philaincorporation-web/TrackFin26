/**
 * Outils communs aux scripts d'administration lancés depuis le terminal
 * (scripts/create-admin.ts, scripts/reset-password.ts).
 */
import { config } from "dotenv";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";

config({ path: ".env.local", quiet: true, override: false });

// Tampon partagé : un bloc reçu peut contenir plusieurs saisies (collage,
// entrée redirigée), la suite est conservée pour la question suivante.
let buffer = "";

/** Saisie masquée (rien ne s'affiche à l'écran ni dans l'historique du terminal). */
export function askHidden(question: string): Promise<string> {
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

/** Demande un mot de passe deux fois ; arrête le script si les saisies diffèrent. */
export async function askNewPassword(): Promise<string> {
  const password = await askHidden("Nouveau mot de passe (10 caractères min.) : ");
  const confirm = await askHidden("Confirmez le mot de passe : ");
  if (password !== confirm) {
    console.error("Les mots de passe ne correspondent pas.");
    process.exit(1);
  }
  return password;
}

/** Client Prisma du script ; affiche la base visée (hôte seul, sans identifiants) avant toute écriture. */
export function connect(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL manquante (voir .env.example)");
  console.log(`Base ciblée : ${new URL(connectionString).host} (branche ${process.env.NEON_BRANCH ?? "?"})`);
  return new PrismaClient({
    adapter: new PrismaNeon({ connectionString }),
    // Une base Neon en veille peut mettre quelques secondes à se réveiller.
    transactionOptions: { maxWait: 15_000, timeout: 20_000 },
  });
}

export function run(main: () => Promise<void>) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
