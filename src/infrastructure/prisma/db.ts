import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./client/client";

// Singleton Prisma avec adapter pg (Prisma 7)
// En dev, évite de créer plusieurs connexions lors du hot-reload Next.js

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export const db: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
