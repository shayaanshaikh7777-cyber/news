import { NextResponse } from "next/server";
import prisma, { isDatabaseConfiguredCheck } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = isDatabaseConfiguredCheck();

  if (!configured) {
    return NextResponse.json(
      {
        status: "error",
        database: "unavailable",
        reason: "database_not_configured",
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
    // Fast ping check with 3-second timeout
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("DB ping timeout")), 3000)
      ),
    ]);

    return NextResponse.json(
      {
        status: "ok",
        database: "connected",
        service: "awaaz-jamkhedcha",
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch {
    return NextResponse.json(
      {
        status: "error",
        database: "unavailable",
        reason: "database_connection_failed",
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
