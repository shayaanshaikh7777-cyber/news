import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: ReturnType<typeof createPrismaClient> | undefined;
}

const rawUrl = process.env.DATABASE_URL?.trim() || "";
const isPostgresProtocol =
  rawUrl.startsWith("postgresql://") || rawUrl.startsWith("postgres://");
const isLocalAddress =
  rawUrl.includes("localhost") || rawUrl.includes("127.0.0.1");

// Database is considered legitimately configured if:
// 1. In production: A valid remote postgres protocol is supplied and NOT localhost/127.0.0.1
// 2. In development: Any valid postgres protocol is supplied
export const isDatabaseConfigured =
  isPostgresProtocol &&
  (process.env.NODE_ENV !== "production" || !isLocalAddress);

// In production, NEVER point to localhost:5432
const databaseUrl = isDatabaseConfigured
  ? rawUrl
  : process.env.NODE_ENV === "development"
  ? "postgresql://postgres:postgres@localhost:5432/awaaz_jamkhedcha?schema=public"
  : "postgresql://unconfigured:unconfigured@database-not-configured.invalid:5432/awaaz?schema=public";

if (process.env.NODE_ENV === "production" && !isDatabaseConfigured) {
  // Emit a single, clean diagnostic notice in production logs
  console.warn(
    "[Database Notice] Production DATABASE_URL is not configured in Vercel environment variables. " +
    "Public pages will safely serve fallback data. To enable live data and CMS editing, " +
    "configure a PostgreSQL DATABASE_URL in your Vercel Project Settings."
  );
}

function createPrismaClient() {
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = global.prismaGlobal || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prismaGlobal = prisma;
}

// Fast liveness cache so server components never hang waiting for an offline database
let dbAvailableCache: boolean | null = null;
let lastCheckTime = 0;
const CHECK_TTL_MS = 30000; // 30 seconds

export async function isDatabaseAvailable(): Promise<boolean> {
  // If database is not configured (especially in production), immediately return false without socket connection
  if (!isDatabaseConfigured) {
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
        setTimeout(() => reject(new Error("DB Timeout")), 1000)
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

