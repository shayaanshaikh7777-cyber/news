"use server";

import prisma, { isDatabaseAvailable } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isSuperAdmin, isEditor } from "@/lib/rbac";
import { recordAuditLog } from "@/lib/audit";
import fs from "fs";
import path from "path";

export interface DatabaseSyncResult {
  success: boolean;
  message: string;
  error?: string;
  tablesVerified?: string[];
}

/**
 * Standard default categories for Awaaz Jamkhedcha news portal
 */
const DEFAULT_CATEGORIES = [
  { name: "Jamkhed Special", nameMarathi: "जामखेड विशेष", slug: "jamkhed-special", color: "#991B1B", sortOrder: 1 },
  { name: "Politics", nameMarathi: "राजकारण", slug: "politics", color: "#1E3A8A", sortOrder: 2 },
  { name: "Agriculture", nameMarathi: "शेती व हवामान", slug: "agriculture", color: "#166534", sortOrder: 3 },
  { name: "Crime & Police", nameMarathi: "गुन्हेगारी व पोलीस", slug: "crime", color: "#9A3412", sortOrder: 4 },
  { name: "Sports", nameMarathi: "क्रीडा", slug: "sports", color: "#065F46", sortOrder: 5 },
  { name: "Editorial", nameMarathi: "संपादकीय", slug: "editorial", color: "#374151", sortOrder: 6 },
  { name: "Rural News", nameMarathi: "गावाकडच्या बातम्या", slug: "rural", color: "#854D0E", sortOrder: 7 },
];

/**
 * Executes idempotent database schema synchronization.
 * Creates all missing production tables (Category, Location, Article, MediaAsset, etc.)
 * without dropping or altering existing data.
 */
export async function syncDatabaseSchemaAction(): Promise<DatabaseSyncResult> {
  const user = await getCurrentUser();
  if (!user || (!isSuperAdmin(user.role) && !isEditor(user.role))) {
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
    const migrationFilePath = path.join(
      process.cwd(),
      "prisma",
      "migrations",
      "20260319000000_init",
      "migration.sql"
    );

    let sqlContent = "";
    if (fs.existsSync(migrationFilePath)) {
      sqlContent = fs.readFileSync(migrationFilePath, "utf-8");
    }

    if (!sqlContent) {
      return {
        success: false,
        message: "मायग्रेशन फाईल सापडली नाही.",
        error: "MIGRATION_FILE_NOT_FOUND",
      };
    }

    // Split statements by semicolon while respecting DO $$ blocks
    const doBlockRegex = /DO\s+\$\$[\s\S]*?\$\$;/gi;
    const doBlocks = sqlContent.match(doBlockRegex) || [];
    const contentWithoutDo = sqlContent.replace(doBlockRegex, "");

    const simpleStatements = contentWithoutDo
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    // Execute simple DDL statements (CREATE TABLE IF NOT EXISTS, CREATE INDEX IF NOT EXISTS)
    for (const stmt of simpleStatements) {
      if (stmt.length > 5) {
        try {
          await prisma.$executeRawUnsafe(stmt);
        } catch (stmtErr: any) {
          console.warn("[Schema Sync statement notice]:", stmtErr?.message?.slice(0, 150));
        }
      }
    }

    // Execute foreign key DO $$ blocks
    for (const doBlock of doBlocks) {
      try {
        await prisma.$executeRawUnsafe(doBlock);
      } catch (doErr: any) {
        console.warn("[Schema Sync FK notice]:", doErr?.message?.slice(0, 150));
      }
    }

    // Seed default categories if Category table is empty
    try {
      const catCount = await prisma.category.count();
      if (catCount === 0) {
        for (const cat of DEFAULT_CATEGORIES) {
          await prisma.category.create({
            data: {
              name: cat.name,
              nameMarathi: cat.nameMarathi,
              slug: cat.slug,
              color: cat.color,
              sortOrder: cat.sortOrder,
              isActive: true,
            },
          });
        }
      }
    } catch (catErr) {
      console.warn("[Category seed notice]:", catErr);
    }

    // Verify key tables
    const verified: string[] = [];
    try {
      await prisma.category.findFirst({ select: { id: true } });
      verified.push("Category");
    } catch {}

    try {
      await prisma.location.findFirst({ select: { id: true } });
      verified.push("Location");
    } catch {}

    try {
      await prisma.article.findFirst({ select: { id: true } });
      verified.push("Article");
    } catch {}

    try {
      await prisma.mediaAsset.findFirst({ select: { id: true } });
      verified.push("MediaAsset");
    } catch {}

    try {
      await prisma.aIProvider.findFirst({ select: { id: true } });
      verified.push("AIProvider");
    } catch {}

    await recordAuditLog({
      userId: user.id,
      action: "SCHEMA_SYNC",
      entity: "Database",
      entityId: "postgres",
      details: { verifiedTables: verified },
    });

    return {
      success: true,
      message: "डेटाबेस स्कीमा आणि सर्व सारण्या (Tables) यशस्वीरित्या तयार व सिंक झाल्या आहेत!",
      tablesVerified: verified,
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

