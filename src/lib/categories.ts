import prisma, { isDatabaseAvailable } from "./prisma";

export interface CategoryDTO {
  id: string;
  name: string;
  nameMarathi: string;
  slug: string;
  color?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export const DEFAULT_CATEGORIES = [
  { name: "Jamkhed Special", nameMarathi: "जामखेड विशेष", slug: "jamkhed-special", color: "#991B1B", sortOrder: 1 },
  { name: "Politics", nameMarathi: "राजकारण", slug: "politics", color: "#1E3A8A", sortOrder: 2 },
  { name: "Agriculture", nameMarathi: "शेती व हवामान", slug: "agriculture", color: "#166534", sortOrder: 3 },
  { name: "Crime & Police", nameMarathi: "गुन्हेगारी व पोलीस", slug: "crime", color: "#9A3412", sortOrder: 4 },
  { name: "Sports", nameMarathi: "क्रीडा", slug: "sports", color: "#065F46", sortOrder: 5 },
  { name: "Editorial", nameMarathi: "संपादकीय", slug: "editorial", color: "#374151", sortOrder: 6 },
  { name: "Rural News", nameMarathi: "गावाकडच्या बातम्या", slug: "rural", color: "#854D0E", sortOrder: 7 },
];

/**
 * Retrieves active categories from the database.
 * If database is connected but categories table is empty, auto-seeds default news categories
 * with real PostgreSQL-generated IDs, guaranteeing that Category.id always exists in the DB.
 */
export async function getOrSeedCategories(): Promise<CategoryDTO[]> {
  const dbReady = await isDatabaseAvailable();
  if (!dbReady) {
    return [];
  }

  try {
    let categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        nameMarathi: true,
        slug: true,
        color: true,
        sortOrder: true,
        isActive: true,
      },
    });

    // If table is completely empty, seed default categories once so foreign keys never fail
    if (categories.length === 0) {
      console.warn("[getOrSeedCategories] Production Category table is empty. Auto-seeding default categories...");
      for (const cat of DEFAULT_CATEGORIES) {
        await prisma.category.upsert({
          where: { slug: cat.slug },
          update: { isActive: true },
          create: {
            name: cat.name,
            nameMarathi: cat.nameMarathi,
            slug: cat.slug,
            color: cat.color,
            sortOrder: cat.sortOrder,
            isActive: true,
          },
        });
      }

      categories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          nameMarathi: true,
          slug: true,
          color: true,
          sortOrder: true,
          isActive: true,
        },
      });
    }

    return categories;
  } catch (err) {
    console.error("[getOrSeedCategories DB Error]:", err);
    return [];
  }
}

export type CategoryResolutionResult =
  | { success: true; categoryId: string; categoryNameMarathi: string }
  | { success: false; error: string };

/**
 * Verifies and maps an incoming category indicator (ID, slug, or Marathi/English name)
 * to a verified Category.id in the production Category table.
 *
 * Rules:
 * 1. Checks if input exists as Category.id in database.
 * 2. If input is a category name or slug (e.g. from AI), matches against existing categories.
 * 3. Never generates a fake ID or array index.
 * 4. If table is empty, returns clean "Production Category table is empty" message.
 * 5. If provided category does not exist, returns "AI ने दिलेला विभाग उपलब्ध नाही" error.
 */
export async function resolveExistingCategoryId(
  inputCategory?: string | null
): Promise<CategoryResolutionResult> {
  const dbReady = await isDatabaseAvailable();
  if (!dbReady) {
    return {
      success: false,
      error: "डेटाबेस सध्या उपलब्ध नाही (Database Offline).",
    };
  }

  try {
    const totalCount = await prisma.category.count();
    if (totalCount === 0) {
      // Attempt auto-seed
      const seeded = await getOrSeedCategories();
      if (seeded.length === 0) {
        return {
          success: false,
          error: "Production Category table is empty. कृपया ॲडमिन पॅनलमधून प्रथम विभाग तयार करा.",
        };
      }
    }

    // Case 1: No category provided — select default (first active category)
    if (!inputCategory || typeof inputCategory !== "string" || !inputCategory.trim()) {
      const defaultCat = await prisma.category.findFirst({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      });
      if (defaultCat) {
        return {
          success: true,
          categoryId: defaultCat.id,
          categoryNameMarathi: defaultCat.nameMarathi,
        };
      }
      return {
        success: false,
        error: "कृपया बातमीसाठी किमान एक विभाग (Category) निवडा.",
      };
    }

    const trimmed = inputCategory.trim();

    // Case 2: Exact ID match (Primary Key)
    const byId = await prisma.category.findUnique({
      where: { id: trimmed },
    });
    if (byId && byId.isActive) {
      return {
        success: true,
        categoryId: byId.id,
        categoryNameMarathi: byId.nameMarathi,
      };
    }

    // Case 3: Slug match
    const bySlug = await prisma.category.findFirst({
      where: { slug: trimmed.toLowerCase(), isActive: true },
    });
    if (bySlug) {
      return {
        success: true,
        categoryId: bySlug.id,
        categoryNameMarathi: bySlug.nameMarathi,
      };
    }

    // Case 4: Marathi Name or English Name match (AI generated names like "राजकारण" or "Politics")
    const byName = await prisma.category.findFirst({
      where: {
        OR: [
          { nameMarathi: trimmed },
          { name: { equals: trimmed, mode: "insensitive" } },
        ],
        isActive: true,
      },
    });
    if (byName) {
      return {
        success: true,
        categoryId: byName.id,
        categoryNameMarathi: byName.nameMarathi,
      };
    }

    // Case 5: No match found — do NOT invent an ID or bypass foreign key
    return {
      success: false,
      error: "AI ने दिलेला विभाग उपलब्ध नाही. कृपया उपलब्ध विभागातून Category निवडा.",
    };
  } catch (err: any) {
    console.error("[resolveExistingCategoryId error]:", err);
    return {
      success: false,
      error: "विभाग पडताळणी करताना डेटाबेस त्रुटी आली: " + (err?.message || "Unknown error"),
    };
  }
}
