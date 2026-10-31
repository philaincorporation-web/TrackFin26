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

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export type Tx = Prisma.TransactionClient;
