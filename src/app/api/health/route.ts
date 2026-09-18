import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  let dbStatus = "ok";

  try {
    if (process.env.DATABASE_URL) {
      // Fast ping check with 3-second timeout
      await Promise.race([
        prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("DB ping timeout")), 3000)
        ),
      ]);
    } else {
      dbStatus = "unconfigured (using fallback seed data)";
    }
  } catch (error) {
    dbStatus = "degraded (fallback seed data active)";
  }

  return NextResponse.json(
    {
      status: "ok",
      service: "awaaz-jamkhedcha",
      timestamp: new Date().toISOString(),
      database: dbStatus,
      environment: process.env.NODE_ENV || "production",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}

