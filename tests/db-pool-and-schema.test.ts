import { describe, it, expect } from "vitest";
import { normalizeDatabaseUrl, isTableNotFoundError } from "../src/lib/prisma";
import { parseDdlStatements } from "../src/lib/db/migrator";
import { SCHEMA_DDL } from "../src/lib/db/schema-ddl";

describe("Database Connection Pool & URL Normalization", () => {
  it("properly adds pgbouncer, connection_limit=10, and pool_timeout=30 for Supabase Pooler", () => {
    const rawUrl =
      "postgresql://postgres.myproject:mypassword@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres";
    const normalized = normalizeDatabaseUrl(rawUrl);

    expect(normalized).toContain("pgbouncer=true");
    expect(normalized).toContain("connection_limit=10");
    expect(normalized).toContain("pool_timeout=30");
    expect(normalized).toContain("connect_timeout=15");
    expect(normalized).toContain("sslmode=require");
  });

  it("preserves custom PRISMA_CONNECTION_LIMIT if set", () => {
    const orig = process.env.PRISMA_CONNECTION_LIMIT;
    process.env.PRISMA_CONNECTION_LIMIT = "15";
    try {
      const rawUrl =
        "postgresql://postgres.myproject:mypassword@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres";
      const normalized = normalizeDatabaseUrl(rawUrl);
      expect(normalized).toContain("connection_limit=15");
    } finally {
      if (orig) process.env.PRISMA_CONNECTION_LIMIT = orig;
      else delete process.env.PRISMA_CONNECTION_LIMIT;
    }
  });

  it("handles fallback URLs with unencoded special characters in password safely", () => {
    const rawUrl =
      "postgresql://postgres.myproject:p@ss#word@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres";
    const normalized = normalizeDatabaseUrl(rawUrl);
    expect(normalized).toContain("pgbouncer=true");
    expect(normalized).toContain("connection_limit=10");
    expect(normalized).toContain("pool_timeout=30");
  });

  it("detects table not found errors (P2021)", () => {
    expect(isTableNotFoundError({ code: "P2021", message: "table does not exist" })).toBe(true);
    expect(
      isTableNotFoundError({
        message: "The table `public.Category` does not exist in the current database.",
      })
    ).toBe(true);
    expect(isTableNotFoundError({ code: "P2002", message: "unique constraint" })).toBe(false);
  });
});

describe("Schema DDL & Statement Parser", () => {
  it("contains all 21 production models with CREATE TABLE IF NOT EXISTS", () => {
    const expectedTables = [
      "User",
      "ReporterProfile",
      "Category",
      "Location",
      "Article",
      "ArticleRevision",
      "LiveUpdate",
      "BreakingNews",
      "Advertisement",
      "AdImpression",
      "AdClick",
      "ArticleView",
      "WhatsAppSubscriber",
      "PushSubscription",
      "Clipping",
      "AuditLog",
      "Redirect",
      "SiteSetting",
      "AIProvider",
      "AIUsageLog",
      "MediaAsset",
    ];

    for (const table of expectedTables) {
      expect(SCHEMA_DDL).toContain(`CREATE TABLE IF NOT EXISTS "${table}"`);
    }
  });

  it("correctly separates DO $$ blocks from simple DDL statements without syntax errors", () => {
    const { simpleStatements, doBlocks } = parseDdlStatements(SCHEMA_DDL);

    expect(simpleStatements.length).toBeGreaterThan(30);
    expect(doBlocks.length).toBeGreaterThanOrEqual(1);

    // Ensure none of the simple statements contain unclosed DO blocks
    for (const stmt of simpleStatements) {
      expect(stmt).not.toContain("DO $$");
    }

    // Ensure DO blocks contain safe foreign key checks
    for (const doBlock of doBlocks) {
      expect(doBlock).toContain("pg_constraint");
      expect(doBlock).toContain("END $$;");
    }
  });
});
