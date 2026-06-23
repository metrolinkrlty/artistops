// Prisma 7 client using the node-postgres driver adapter.
// DATABASE_URL points at the Supabase transaction pooler (port 6543) in production.
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  // Cap the pool: Supabase's session pooler allows a limited number of
  // clients (pool_size 15), and serverless functions each open their own pool.
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: 7,
    idleTimeoutMillis: 10_000,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
