import { NextResponse } from "next/server";
import prisma, { isDatabaseConfiguredCheck, getSafeDatabaseInfo } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = isDatabaseConfiguredCheck();
  const safeInfo = getSafeDatabaseInfo();

  if (!configured) {
    return NextResponse.json(
      {
        ok: false,
        status: "error",
        database: "not_configured",
        reason: "database_not_configured",
        database_configured: false,
        service: "awaaz-jamkhedcha",
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }

  try {
    // 6-second timeout for serverless connection pooler ping
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Database connection ping timeout after 6000ms")),
          6000
        )
      ),
    ]);

    return NextResponse.json(
      {
        ok: true,
        status: "ok",
        database: "connected",
        service: "awaaz-jamkhedcha",
        timestamp: new Date().toISOString(),
        database_host: safeInfo.host,
        database_scheme: safeInfo.scheme,
        is_pooler: safeInfo.isPooler,
        has_pgbouncer: safeInfo.hasPgBouncer,
        username_type: safeInfo.usernameType,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (err: any) {
    const rawMsg = String(err?.message || "Connection failed");
    // Clean any sensitive string that might look like a password
    const sanitizedMsg = rawMsg.replace(/:[^:@]+@/, ":••••••••@");

    let diagnosticHint: string | undefined;
    if (safeInfo.isMissingProjectRefUser) {
      diagnosticHint =
        "Supabase Transaction Pooler (port 6543) requires the username to include the project ref: postgres.[project-ref]. Using 'postgres' alone causes 'Authentication failed'.";
    } else if (sanitizedMsg.includes("Authentication failed")) {
      diagnosticHint =
        "Authentication failed against PostgreSQL. Verify your password in Supabase Dashboard, and ensure any special characters in the password are URL-encoded (e.g., %40 for @, %23 for #).";
    }

    return NextResponse.json(
      {
        ok: false,
        status: "error",
        database: "connection_failed",
        reason: safeInfo.isMissingProjectRefUser
          ? "pooler_username_requires_project_ref"
          : "database_connection_failed",
        database_configured: true,
        error_code: err?.code || (rawMsg.includes("timeout") ? "TIMEOUT" : "UNKNOWN"),
        error_type: err?.name || "Error",
        error_summary: sanitizedMsg.slice(0, 300),
        database_host: safeInfo.host,
        database_port: safeInfo.port,
        database_scheme: safeInfo.scheme,
        is_pooler: safeInfo.isPooler,
        has_pgbouncer: safeInfo.hasPgBouncer,
        username_type: safeInfo.usernameType,
        is_missing_project_ref_user: safeInfo.isMissingProjectRefUser,
        diagnostic_hint: diagnosticHint,
        service: "awaaz-jamkhedcha",
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }
}
