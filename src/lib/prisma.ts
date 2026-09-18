import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

// Ensure Prisma doesn't crash initialization when DATABASE_URL is not set or invalid during static build
const rawUrl = process.env.DATABASE_URL || "";
const isValidPostgres =
  rawUrl.startsWith("postgresql://") || rawUrl.startsWith("postgres://");
const databaseUrl = isValidPostgres
  ? rawUrl
  : "postgresql://postgres:postgres@localhost:5432/awaaz_jamkhedcha?schema=public";

export const prisma =
  global.prismaGlobal ||
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prismaGlobal = prisma;
}

// Fast liveness cache so server components never hang waiting for an offline database
let dbAvailableCache: boolean | null = null;
let lastCheckTime = 0;
const CHECK_TTL_MS = 30000; // 30 seconds

export async function isDatabaseAvailable(): Promise<boolean> {
  if (!isValidPostgres) {
    return false;
  }

  const now = Date.now();
  if (dbAvailableCache !== null && now - lastCheckTime < CHECK_TTL_MS) {
    return dbAvailableCache;
  }

  try {
    lastCheckTime = now;
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("DB Timeout")), 800)
      ),
    ]);
    dbAvailableCache = true;
    return true;
  } catch {
    dbAvailableCache = false;
    return false;
  }
}

export default prisma;

