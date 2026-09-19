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
 * Normalizes a PostgreSQL connection URL:
 * 1. Replaces postgres:// with postgresql:// for standard Prisma client parsing.
 * 2. If connecting to Supabase Transaction Pooler (port 6543 or pooler.supabase.com):
 *    - Automatically appends pgbouncer=true if missing (CRITICAL: prevents prepared statement errors on PgBouncer).
 *    - Ensures connection_limit=1 for serverless function pool safety.
 * 3. Ensures connect_timeout=15 for serverless cold start network resilience.
 * 4. Ensures sslmode=require for remote cloud databases if not localhost.
 */
export function normalizeDatabaseUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  if (!url) return url;

  // Standardize protocol
  if (url.startsWith("postgres://")) {
    url = "postgresql://" + url.slice("postgres://".length);
  }

  const isLocal = url.includes("localhost") || url.includes("127.0.0.1");
  const isSupabasePooler =
    url.includes(":6543") || url.includes("pooler.supabase.com");

  // Determine if query params exist
  const hasQuery = url.includes("?");
  const prefix = hasQuery ? "&" : "?";

  const paramsToAdd: string[] = [];

  // 1. Supabase / PgBouncer Transaction Pooler requirements
  if (isSupabasePooler) {
    if (!url.includes("pgbouncer=true")) {
      paramsToAdd.push("pgbouncer=true");
    }
    if (!url.includes("connection_limit=")) {
      paramsToAdd.push("connection_limit=1");
    }
  }

  // 2. Cold start connection timeout resilience (15 seconds)
  if (!url.includes("connect_timeout=")) {
    paramsToAdd.push("connect_timeout=15");
  }

  // 3. SSL mode requirement for cloud hosts
  if (!isLocal && !url.includes("sslmode=")) {
    paramsToAdd.push("sslmode=require");
  }

  if (paramsToAdd.length > 0) {
    url += prefix + paramsToAdd.join("&");
  }

  return url;
}

/**
 * Safely extracts non-sensitive database metadata for diagnostics (host, port, scheme).
 * NEVER returns credentials, passwords, or full connection strings.
 */
export function getSafeDatabaseInfo(): {
  exists: boolean;
  scheme: string | null;
  host: string | null;
  port: string | null;
  database: string | null;
  isPooler: boolean;
  hasPgBouncer: boolean;
} {
  const raw = (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    ""
  ).trim();

  if (!raw) {
    return {
      exists: false,
      scheme: null,
      host: null,
      port: null,
      database: null,
      isPooler: false,
      hasPgBouncer: false,
    };
  }

  try {
    // Parse URL safely
    const parsed = new URL(
      raw.startsWith("postgres://")
        ? "postgresql://" + raw.slice("postgres://".length)
        : raw
    );

    return {
      exists: true,
      scheme: parsed.protocol.replace(":", ""),
      host: parsed.hostname || null,
      port: parsed.port || "5432",
      database: parsed.pathname ? parsed.pathname.replace("/", "") : null,
      isPooler: parsed.port === "6543" || parsed.hostname.includes("pooler"),
      hasPgBouncer: parsed.searchParams.get("pgbouncer") === "true",
    };
  } catch {
    // Fallback regex if URL parsing fails on special chars in password
    const hostMatch = raw.match(/@([^:\/?#]+)(?::(\d+))?/);
    return {
      exists: true,
      scheme: raw.startsWith("postgres://") ? "postgres" : "postgresql",
      host: hostMatch ? hostMatch[1] : "unknown",
      port: hostMatch && hostMatch[2] ? hostMatch[2] : "5432",
      database: null,
      isPooler: raw.includes(":6543") || raw.includes("pooler"),
      hasPgBouncer: raw.includes("pgbouncer=true"),
    };
  }
}

/**
 * Returns the validated PostgreSQL database URL.
 * Checks in priority order:
 * 1. DATABASE_URL
 * 2. POSTGRES_PRISMA_URL (Supabase integration standard)
 * 3. POSTGRES_URL (Vercel Postgres / Supabase fallback)
 */
export function getDatabaseUrl(): string {
  const rawUrl = (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    ""
  ).trim();

  const isPostgres =
    rawUrl.startsWith("postgresql://") || rawUrl.startsWith("postgres://");
  const isLocal =
    rawUrl.includes("localhost") || rawUrl.includes("127.0.0.1");

  if (process.env.NODE_ENV === "production") {
    if (!rawUrl || !isPostgres || isLocal) {
      throw new DatabaseNotConfiguredError();
    }
    return normalizeDatabaseUrl(rawUrl);
  }

  // Development mode
  if (isPostgres) {
    return normalizeDatabaseUrl(rawUrl);
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

function createPrismaClient() {
  const configured = isDatabaseConfiguredCheck();
  let urlToUse: string;

  if (configured) {
    urlToUse = getDatabaseUrl();
  } else {
    urlToUse =
      "postgresql://unconfigured:unconfigured@database-not-configured.invalid:5432/awaaz?schema=public&connect_timeout=0";
  }

  const baseClient = new PrismaClient({
    datasources: {
      db: {
        url: urlToUse,
      },
    },
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

  if (!configured) {
    return baseClient.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation }) {
            throw new DatabaseNotConfiguredError(
              `DATABASE_NOT_CONFIGURED: Cannot execute ${model}.${operation}. Production DATABASE_URL is not configured in Vercel environment variables.`
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

// Runtime database connection diagnostics state
let dbAvailableCache: boolean | null = null;
let lastCheckTime = 0;
let lastDbError: string | null = null;
let lastDbErrorCode: string | null = null;

const SUCCESS_TTL_MS = 30000; // 30 seconds cache on success
const FAILURE_RETRY_MS = 4000; // Retry after 4 seconds on failure

export function getLastDatabaseError(): {
  error: string | null;
  code: string | null;
} {
  return {
    error: lastDbError,
    code: lastDbErrorCode,
  };
}

/**
 * Performs a fast liveness query against PostgreSQL.
 * Distinguishes not_configured from connection_failed.
 */
export async function isDatabaseAvailable(): Promise<boolean> {
  // If database is not configured in environment, fail immediately without network call
  if (!isDatabaseConfiguredCheck()) {
    lastDbError = "DATABASE_NOT_CONFIGURED";
    lastDbErrorCode = "NOT_CONFIGURED";
    return false;
  }

  const now = Date.now();
  const ttl = dbAvailableCache ? SUCCESS_TTL_MS : FAILURE_RETRY_MS;

  if (dbAvailableCache !== null && now - lastCheckTime < ttl) {
    return dbAvailableCache;
  }

  try {
    lastCheckTime = now;
    // 5-second timeout for cloud connection pooling cold starts
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Database connection ping timeout after 5000ms")),
          5000
        )
      ),
    ]);

    dbAvailableCache = true;
    lastDbError = null;
    lastDbErrorCode = null;
    return true;
  } catch (err: any) {
    dbAvailableCache = false;
    // Sanitize any password occurrence in error message
    const msg = String(err?.message || "Database connection error").replace(
      /:[^:@]+@/,
      ":••••••••@"
    );
    lastDbError = msg;
    lastDbErrorCode = err?.code || (msg.includes("timeout") ? "TIMEOUT" : "CONNECTION_FAILED");

    console.error("[Prisma Connection Check Failed]", {
      code: lastDbErrorCode,
      message: lastDbError,
      info: getSafeDatabaseInfo(),
    });

    return false;
  }
}

export default prisma;
