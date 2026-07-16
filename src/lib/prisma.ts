// Prisma 7 client using the node-postgres driver adapter.
// For serverless (Netlify functions), DATABASE_URL should be Supabase's
// TRANSACTION pooler — host on port 6543 with `?pgbouncer=true`. The session
// pooler (port 5432) caps connections (~15); with each function holding its own
// pool it exhausts quickly → slow logins and sluggish navigation.
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
    // Keep each function's pool minimal, and release idle connections back to
    // the pooler instead of hoarding them for the instance's whole life.
    max: 2,
    idleTimeoutMillis: 10000,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
