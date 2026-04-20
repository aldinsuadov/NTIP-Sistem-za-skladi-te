import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
};

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);

  return {
    prisma: new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    }),
    pool,
  };
}

const client =
  globalForPrisma.prisma && globalForPrisma.pool
    ? { prisma: globalForPrisma.prisma, pool: globalForPrisma.pool }
    : createPrismaClient();

export const prisma = client.prisma;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = client.prisma;
  globalForPrisma.pool = client.pool;
}
