import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: any | undefined;
}

export class DatabaseNotConfiguredError extends Error {
  code = "DATABASE_NOT_CONFIGURED";
  constructor(message?: string) {
    super(
      message ||
        "DATABASE_NOT_CONFIGURED: Production DATABASE_URL environment variable is missing or invalid. Please configure a valid PostgreSQL connection string in Vercel Project Settings -> Environment Variables."
    );
    this.name = "DatabaseNotConfiguredError";
  }
}

/**
 * Returns the validated PostgreSQL database URL.
 * In production:
 * - DATABASE_URL is strictly required.
 * - Must start with postgresql:// or postgres://.
 * - Must NOT point to localhost or 127.0.0.1.
 * - Throws DatabaseNotConfiguredError if missing or invalid.
 * In development:
 * - Uses DATABASE_URL if present, otherwise allows local postgres.
 */
export function getDatabaseUrl(): string {
  const rawUrl = process.env.DATABASE_URL?.trim() || "";
  const isPostgres =
    rawUrl.startsWith("postgresql://") || rawUrl.startsWith("postgres://");
  const isLocal =
    rawUrl.includes("localhost") || rawUrl.includes("127.0.0.1");

  if (process.env.NODE_ENV === "production") {
    if (!rawUrl || !isPostgres || isLocal) {
      throw new DatabaseNotConfiguredError();
    }
    return rawUrl;
  }

  // Development mode
  if (isPostgres) {
    return rawUrl;
  }

  return "postgresql://postgres:postgres@localhost:5432/awaaz_jamkhedcha?schema=public";
}

/**
 * Checks whether the database is configured according to environment rules.
 */
export function isDatabaseConfiguredCheck(): boolean {
  try {
    getDatabaseUrl();
    return true;
  } catch {
    return false;
  }
}

export const isDatabaseConfigured = isDatabaseConfiguredCheck();

if (process.env.NODE_ENV === "production" && !isDatabaseConfigured) {
  console.warn(
    "[Database Notice] Production DATABASE_URL is not configured in Vercel environment variables. " +
    "Database operations will fail fast with DATABASE_NOT_CONFIGURED. " +
    "Please configure a PostgreSQL DATABASE_URL in Vercel Project Settings."
  );
}

function createPrismaClient() {
  let urlToUse: string;
  try {
    urlToUse = getDatabaseUrl();
  } catch {
    urlToUse = "postgresql://unconfigured:unconfigured@localhost:5432/dummy?schema=public&connect_timeout=0";
  }

  const baseClient = new PrismaClient({
    datasources: {
      db: {
        url: urlToUse,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  if (!isDatabaseConfigured) {
    return baseClient.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation }) {
            throw new DatabaseNotConfiguredError(
              `DATABASE_NOT_CONFIGURED: Cannot execute ${model}.${operation}. Production DATABASE_URL is not configured.`
            );
          },
        },
      },
    });
  }

  return baseClient;
}

export const prisma: PrismaClient = (global.prismaGlobal || createPrismaClient()) as any;

if (process.env.NODE_ENV !== "production") {
  global.prismaGlobal = prisma;
}

// Fast liveness cache so server components never hang waiting for an offline database
let dbAvailableCache: boolean | null = null;
let lastCheckTime = 0;
const CHECK_TTL_MS = 30000; // 30 seconds

export async function isDatabaseAvailable(): Promise<boolean> {
  // If database is not configured (especially in production), immediately return false without socket connection
  if (!isDatabaseConfiguredCheck()) {
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
        setTimeout(() => reject(new Error("DB Timeout")), 1500)
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

