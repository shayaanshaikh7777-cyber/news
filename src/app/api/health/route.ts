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

    return NextResponse.json(
      {
        ok: false,
        status: "error",
        database: "connection_failed",
        reason: "database_connection_failed",
        database_configured: true,
        error_code: err?.code || (rawMsg.includes("timeout") ? "TIMEOUT" : "UNKNOWN"),
        error_type: err?.name || "Error",
        error_summary: sanitizedMsg.slice(0, 300),
        database_host: safeInfo.host,
        database_port: safeInfo.port,
        database_scheme: safeInfo.scheme,
        is_pooler: safeInfo.isPooler,
        has_pgbouncer: safeInfo.hasPgBouncer,
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
