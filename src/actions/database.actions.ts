"use server";

import prisma, { isDatabaseAvailable } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isSuperAdmin, isEditor } from "@/lib/rbac";
import { recordAuditLog } from "@/lib/audit";
import { runDatabaseMigration } from "@/lib/db/migrator";

export interface DatabaseSyncResult {
  success: boolean;
  message: string;
  error?: string;
  tablesVerified?: string[];
  durationMs?: number;
}

/**
 * Executes idempotent database schema synchronization.
 * Creates all missing production tables (Category, Location, Article, MediaAsset, etc.)
 * without dropping or altering existing data.
 */
export async function syncDatabaseSchemaAction(): Promise<DatabaseSyncResult> {
  const user = await getCurrentUser();

  // Allow execution if user is SuperAdmin or Editor, or if User table is not yet provisioned (bootstrap mode)
  let isBootstrapAllowed = false;
  try {
    const userTableCount = await prisma.user.count();
    if (userTableCount === 0) {
      isBootstrapAllowed = true;
    }
  } catch {
    // If User table does not exist, allow initial bootstrap
    isBootstrapAllowed = true;
  }

  if (!isBootstrapAllowed && (!user || (!isSuperAdmin(user.role) && !isEditor(user.role)))) {
    return {
      success: false,
      message: "अनधिकृत वापर. फक्त सुपर ॲडमिन किंवा संपादकांना ही परवानगी आहे.",
      error: "UNAUTHORIZED",
    };
  }

  if (!(await isDatabaseAvailable())) {
    return {
      success: false,
      message: "डेटाबेस सध्या उपलब्ध नाही (PostgreSQL Offline).",
      error: "DATABASE_UNAVAILABLE",
    };
  }

  try {
    const result = await runDatabaseMigration(prisma);

    if (user) {
      try {
        await recordAuditLog({
          userId: user.id,
          action: "SCHEMA_SYNC",
          entity: "Database",
          entityId: "postgres",
          details: { verifiedTables: result.tablesVerified, durationMs: result.durationMs },
        });
      } catch (auditErr) {
        console.warn("[Schema Sync audit log skipped]:", auditErr);
      }
    }

    return {
      success: result.success,
      message: result.message,
      tablesVerified: result.tablesVerified,
      durationMs: result.durationMs,
      error: result.error,
    };
  } catch (err: any) {
    console.error("[syncDatabaseSchemaAction error]", err);
    return {
      success: false,
      message: "स्कीमा सिंक करताना तांत्रिक त्रुटी आली: " + (err?.message || "Unknown error"),
      error: err?.message,
    };
  }
}
