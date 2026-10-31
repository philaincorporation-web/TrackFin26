import "server-only";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient, type Prisma } from "@/generated/prisma/client";

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL manquante (voir .env.example)");
  return new PrismaClient({
    adapter: new PrismaNeon({ connectionString }),
    // Neon met la base en veille après inactivité : le réveil peut prendre
    // quelques secondes, bien au-delà des 2 s d'attente par défaut de Prisma.
    transactionOptions: { maxWait: 10_000, timeout: 15_000 },
  });
}

// Une seule instance par processus (évite d'épuiser les connexions en dev / HMR).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getClient(): PrismaClient {
  globalForPrisma.prisma ??= createClient();
  return globalForPrisma.prisma;
}

/**
 * Client créé au premier usage réel, pas à l'import : `next build` charge les
 * modules des routes pour lire leur configuration, sans variables
 * d'environnement de base de données (ex. build Vercel). Une variable absente
 * ne fait échouer que la requête qui touche la base, avec un message explicite.
 */
export const db = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getClient();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export type Tx = Prisma.TransactionClient;
