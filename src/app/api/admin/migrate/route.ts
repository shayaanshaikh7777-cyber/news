import { NextRequest, NextResponse } from "next/server";
import prisma, { isDatabaseAvailable } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/rbac";
import { runDatabaseMigration } from "@/lib/db/migrator";

export const dynamic = "force-dynamic";

async function handleMigration(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret") || req.headers.get("x-migration-secret");
  const expectedSecret =
    process.env.ADMIN_MIGRATION_KEY ||
    process.env.ADMIN_PASSWORD ||
    "Aa@12345";

  const user = await getCurrentUser();
  const isAuthorized = (user && isSuperAdmin(user.role)) || (secret && secret === expectedSecret);

  if (!isAuthorized) {
    return NextResponse.json(
      {
        success: false,
        error: "UNAUTHORIZED",
        message: "अनधिकृत वापर. सुपर ॲडमिन लॉगिन किंवा ?secret=... आवश्यक आहे.",
      },
      { status: 401 }
    );
  }

  const dbReady = await isDatabaseAvailable();
  if (!dbReady) {
    return NextResponse.json(
      {
        success: false,
        error: "DATABASE_UNAVAILABLE",
        message: "डेटाबेस सध्या उपलब्ध नाही (PostgreSQL Offline).",
      },
      { status: 503 }
    );
  }

  try {
    const result = await runDatabaseMigration(prisma);
    return NextResponse.json({
      success: result.success,
      message: result.message,
      tablesVerified: result.tablesVerified,
      durationMs: result.durationMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "MIGRATION_FAILED",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleMigration(req);
}

export async function POST(req: NextRequest) {
  return handleMigration(req);
}

