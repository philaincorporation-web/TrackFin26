import { readFileSync } from "node:fs";
import { parse } from "dotenv";

/**
 * Garde-fou : les tests d'intégration écrivent en base (et le journal d'audit
 * est indélébile). Ils exigent une URL explicite et refusent de viser la base
 * configurée dans .env.local (branche principale).
 */
const url = process.env.INTEGRATION_DATABASE_URL;
if (!url) throw new Error("INTEGRATION_DATABASE_URL requis : URL d'une branche Neon de test, jamais main.");

let mainHost: string | null = null;
try {
  const local = parse(readFileSync(".env.local"));
  if (local.DATABASE_URL) mainHost = new URL(local.DATABASE_URL).hostname;
} catch {
  // pas de .env.local : rien à comparer
}
if (mainHost && new URL(url).hostname === mainHost) {
  throw new Error("Refus : INTEGRATION_DATABASE_URL pointe sur la base de .env.local (main).");
}

process.env.DATABASE_URL = url;
