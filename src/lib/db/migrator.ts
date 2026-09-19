import { PrismaClient } from "@prisma/client";
import { SCHEMA_DDL } from "./schema-ddl";
import bcrypt from "bcryptjs";

export interface MigrationResult {
  success: boolean;
  message: string;
  tablesVerified: string[];
  durationMs: number;
  error?: string;
}

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
 * Parses SQL DDL content into executable statements.
 * Isolates DO $$ blocks to prevent splitting internal semicolons.
 */
export function parseDdlStatements(ddl: string): { simpleStatements: string[]; doBlocks: string[] } {
  const doBlockRegex = /DO\s+\$\$[\s\S]*?\$\$;/gi;
  const doBlocks = ddl.match(doBlockRegex) || [];
  const contentWithoutDo = ddl.replace(doBlockRegex, "");

  const simpleStatements = contentWithoutDo
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 5 && !s.startsWith("--"));

  return { simpleStatements, doBlocks };
}

/**
 * Executes idempotent migration over Prisma client.
 * Safe to execute on Supabase Transaction Pooler (:6543) without advisory locks.
 */
export async function runDatabaseMigration(prisma: PrismaClient): Promise<MigrationResult> {
  const startTime = Date.now();

  try {
    const { simpleStatements, doBlocks } = parseDdlStatements(SCHEMA_DDL);

    // 1. Execute simple DDL statements (CREATE TABLE IF NOT EXISTS, CREATE INDEX IF NOT EXISTS)
    for (const stmt of simpleStatements) {
      try {
        await prisma.$executeRawUnsafe(stmt);
      } catch (err: any) {
        // Safe to ignore duplicate notices or harmless constraint warnings
        const msg = err?.message || "";
        if (!msg.includes("already exists") && !msg.includes("duplicate")) {
          console.warn("[Migrator statement notice]:", msg.slice(0, 150));
        }
      }
    }

    // 2. Execute foreign key safe DO $$ blocks
    for (const doBlock of doBlocks) {
      try {
        await prisma.$executeRawUnsafe(doBlock);
      } catch (err: any) {
        console.warn("[Migrator FK notice]:", err?.message?.slice(0, 150));
      }
    }

    // 3. Mark migration as applied in _prisma_migrations so Prisma CLI recognizes it
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
          "id" VARCHAR(36) PRIMARY KEY,
          "checksum" VARCHAR(64) NOT NULL,
          "finished_at" TIMESTAMPTZ,
          "migration_name" VARCHAR(255) NOT NULL,
          "logs" TEXT,
          "rolled_back_at" TIMESTAMPTZ,
          "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "applied_steps_count" INTEGER NOT NULL DEFAULT 0
        );
      `);

      await prisma.$executeRawUnsafe(`
        INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
        VALUES (
          '20260319000000_init',
          'd8f63567a911e3592759e69e46fb7a7ad4758d40be1e7a56133efb5f39e31d4e',
          NOW(),
          '20260319000000_init',
          1
        )
        ON CONFLICT ("id") DO NOTHING;
      `);
    } catch (migErr: any) {
      console.warn("[Migrator _prisma_migrations notice]:", migErr?.message?.slice(0, 150));
    }

    // 4. Seed default categories if empty
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
      console.warn("[Migrator Category seed notice]:", catErr);
    }

    // 5. Ensure Master Admin user exists
    try {
      const adminEmail = process.env.ADMIN_EMAIL || "admin@test.com";
      const adminPass = process.env.ADMIN_PASSWORD || "Aa@12345";
      const userCount = await prisma.user.count({ where: { email: adminEmail } });
      if (userCount === 0) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(adminPass, salt);
        await prisma.user.create({
          data: {
            name: "मुख्य संपादक (Master Admin)",
            email: adminEmail,
            passwordHash: hash,
            role: "SUPER_ADMIN",
            status: "ACTIVE",
          },
        });
      }
    } catch (userErr) {
      console.warn("[Migrator Admin user seed notice]:", userErr);
    }

    // 6. Verify key tables
    const verified: string[] = [];
    const checkModels = [
      { name: "User", fn: () => prisma.user.findFirst({ select: { id: true } }) },
      { name: "Category", fn: () => prisma.category.findFirst({ select: { id: true } }) },
      { name: "Location", fn: () => prisma.location.findFirst({ select: { id: true } }) },
      { name: "Article", fn: () => prisma.article.findFirst({ select: { id: true } }) },
      { name: "MediaAsset", fn: () => prisma.mediaAsset.findFirst({ select: { id: true } }) },
      { name: "AIProvider", fn: () => prisma.aIProvider.findFirst({ select: { id: true } }) },
      { name: "BreakingNews", fn: () => prisma.breakingNews.findFirst({ select: { id: true } }) },
      { name: "Advertisement", fn: () => prisma.advertisement.findFirst({ select: { id: true } }) },
    ];

    for (const model of checkModels) {
      try {
        await model.fn();
        verified.push(model.name);
      } catch (checkErr: any) {
        console.warn(`[Migrator verify ${model.name} failed]:`, checkErr?.message?.slice(0, 100));
      }
    }

    const durationMs = Date.now() - startTime;
    return {
      success: verified.includes("User") && verified.includes("Category") && verified.includes("Article"),
      message: `डेटाबेस स्कीमा यशस्वीरित्या अद्ययावत झाला (${verified.length} मॉडेल्स सत्यापित, ${durationMs}ms).`,
      tablesVerified: verified,
      durationMs,
    };
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    console.error("[Migrator Fatal Error]:", err);
    return {
      success: false,
      message: "डेटाबेस मायग्रेशन अयशस्वी: " + (err?.message || "Unknown error"),
      tablesVerified: [],
      durationMs,
      error: err?.message,
    };
  }
}

