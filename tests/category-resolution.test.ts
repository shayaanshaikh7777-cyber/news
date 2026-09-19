import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/lib/prisma", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    default: {
      category: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        count: vi.fn(),
        upsert: vi.fn(),
        findMany: vi.fn(),
      },
    },
    isDatabaseAvailable: vi.fn().mockResolvedValue(true),
  };
});

import { resolveExistingCategoryId, DEFAULT_CATEGORIES } from "../src/lib/categories";
import prisma from "../src/lib/prisma";

describe("Category Foreign Key Protection & Resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("DEFAULT_CATEGORIES includes essential Marathi news beats", () => {
    expect(DEFAULT_CATEGORIES.length).toBeGreaterThanOrEqual(5);
    const slugs = DEFAULT_CATEGORIES.map((c) => c.slug);
    expect(slugs).toContain("politics");
    expect(slugs).toContain("agriculture");
  });

  it("resolves valid category by primary key ID safely", async () => {
    vi.mocked(prisma.category.count).mockResolvedValue(7 as any);
    vi.mocked(prisma.category.findUnique).mockResolvedValue({
      id: "cm12345realid",
      name: "Politics",
      nameMarathi: "राजकारण",
      isActive: true,
    } as any);

    const result = await resolveExistingCategoryId("cm12345realid");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.categoryId).toBe("cm12345realid");
      expect(result.categoryNameMarathi).toBe("राजकारण");
    }
  });

  it("resolves AI-generated Marathi name to existing Category.id", async () => {
    vi.mocked(prisma.category.count).mockResolvedValue(7 as any);
    vi.mocked(prisma.category.findUnique).mockResolvedValue(null as any);
    vi.mocked(prisma.category.findFirst).mockImplementation(async (args: any) => {
      if (args?.where?.OR) {
        return {
          id: "cm_politics_uuid",
          name: "Politics",
          nameMarathi: "राजकारण",
          isActive: true,
        } as any;
      }
      return null as any;
    });

    const result = await resolveExistingCategoryId("राजकारण");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.categoryId).toBe("cm_politics_uuid");
    }
  });

  it("safely REJECTS nonexistent category ID and prevents Article_categoryId_fkey violation", async () => {
    vi.mocked(prisma.category.count).mockResolvedValue(7 as any);
    vi.mocked(prisma.category.findUnique).mockResolvedValue(null as any);
    vi.mocked(prisma.category.findFirst).mockResolvedValue(null as any);

    const result = await resolveExistingCategoryId("cat-jamkhed-fake");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("AI ने दिलेला विभाग उपलब्ध नाही");
    }
  });

  it("falls back to default active category when no category is supplied", async () => {
    vi.mocked(prisma.category.count).mockResolvedValue(7 as any);
    vi.mocked(prisma.category.findFirst).mockResolvedValue({
      id: "cm_default_cat",
      nameMarathi: "जामखेड विशेष",
      isActive: true,
    } as any);

    const result = await resolveExistingCategoryId(undefined);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.categoryId).toBe("cm_default_cat");
    }
  });
});

