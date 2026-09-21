"use server";

import prisma, { isDatabaseAvailable } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isReporter } from "@/lib/rbac";
import { recordAuditLog } from "@/lib/audit";
import { ArticleSummaryItem, NewspaperEdition } from "@/types/newspaper";
import { FALLBACK_ARTICLES } from "@/lib/fallback-data";

export interface SaveEditionResult {
  success: boolean;
  editionId?: string;
  error?: string;
}

/**
 * Saves a newspaper edition into the database using SiteSetting JSON storage.
 * This guarantees zero schema mutations and 100% backward compatibility.
 */
export async function saveNewspaperEditionAction(
  edition: NewspaperEdition
): Promise<SaveEditionResult> {
  try {
    const user = await getCurrentUser();
    if (!user || !isReporter(user.role)) {
      return { success: false, error: "अनधिकृत वापर. संपादन करण्यासाठी परवानगी आवश्यक आहे." };
    }

    if (!edition.id || !edition.title) {
      return { success: false, error: "वृत्तपत्राचे नाव व ओळख क्रमांक आवश्यक आहे." };
    }

    const isReady = await isDatabaseAvailable();
    if (!isReady) {
      return { success: false, error: "डेटाबेस सध्या ऑफलाइन आहे. कृपया स्थानिक पातळीवर सेव्ह करा." };
    }

    const key = `epaper_edition_${edition.id}`;
    const serialized = JSON.stringify(edition);

    // Upsert the edition in SiteSetting
    await prisma.siteSetting.upsert({
      where: { key },
      update: {
        value: serialized,
        description: `Newspaper Edition: ${edition.title} (${edition.editionDate})`,
      },
      create: {
        key,
        value: serialized,
        description: `Newspaper Edition: ${edition.title} (${edition.editionDate})`,
      },
    });

    // Update master index of all saved editions
    const indexKey = "newspaper_editions_index";
    const existingIndexRecord = await prisma.siteSetting.findUnique({
      where: { key: indexKey },
    });

    let indexList: Array<{
      id: string;
      title: string;
      editionDate: string;
      pageCount: number;
      status: string;
      updatedAt: string;
    }> = [];

    if (existingIndexRecord?.value) {
      try {
        indexList = JSON.parse(existingIndexRecord.value);
      } catch {
        indexList = [];
      }
    }

    // Remove if already exists and prepend
    indexList = indexList.filter((e) => e.id !== edition.id);
    indexList.unshift({
      id: edition.id,
      title: edition.title,
      editionDate: edition.editionDate,
      pageCount: edition.pages.length,
      status: edition.status,
      updatedAt: new Date().toISOString(),
    });

    // Keep at most 50 recent editions in the index
    indexList = indexList.slice(0, 50);

    await prisma.siteSetting.upsert({
      where: { key: indexKey },
      update: { value: JSON.stringify(indexList) },
      create: {
        key: indexKey,
        value: JSON.stringify(indexList),
        description: "Index of created Newspaper & E-Paper Editions",
      },
    });

    // Audit log
    await recordAuditLog({
      userId: user.id,
      action: "SAVE_NEWSPAPER_EDITION",
      entity: "NewspaperEdition",
      entityId: edition.id,
      details: { title: edition.title, pages: edition.pages.length, status: edition.status },
    });

    return { success: true, editionId: edition.id };
  } catch (err: unknown) {
    console.error("[saveNewspaperEditionAction] Error:", err);
    const msg = err instanceof Error ? err.message : "वृत्तपत्र सेव्ह करताना त्रुटी आली.";
    return { success: false, error: msg };
  }
}

/**
 * Loads a single saved newspaper edition by ID.
 */
export async function loadNewspaperEditionAction(
  id: string
): Promise<{ success: boolean; data?: NewspaperEdition; error?: string }> {
  try {
    const isReady = await isDatabaseAvailable();
    if (!isReady) {
      return { success: false, error: "डेटाबेस सध्या उपलब्ध नाही." };
    }

    const key = `epaper_edition_${id}`;
    const record = await prisma.siteSetting.findUnique({
      where: { key },
    });

    if (!record || !record.value) {
      return { success: false, error: "आवृत्ती सापडली नाही." };
    }

    const edition: NewspaperEdition = JSON.parse(record.value);
    return { success: true, data: edition };
  } catch (err: unknown) {
    console.error("[loadNewspaperEditionAction] Error:", err);
    return { success: false, error: "आवृत्ती लोड करताना त्रुटी आली." };
  }
}

/**
 * Lists all saved newspaper editions for the admin index.
 */
export async function listNewspaperEditionsAction(): Promise<{
  success: boolean;
  data: Array<{
    id: string;
    title: string;
    editionDate: string;
    pageCount: number;
    status: string;
    updatedAt: string;
  }>;
}> {
  try {
    const isReady = await isDatabaseAvailable();
    if (!isReady) {
      return { success: true, data: [] };
    }

    const record = await prisma.siteSetting.findUnique({
      where: { key: "newspaper_editions_index" },
    });

    if (record?.value) {
      const list = JSON.parse(record.value);
      return { success: true, data: list };
    }

    return { success: true, data: [] };
  } catch (err) {
    console.warn("[listNewspaperEditionsAction] Error:", err);
    return { success: true, data: [] };
  }
}

/**
 * Fetches published articles suitable for assembling in the newspaper builder.
 */
export async function getPublishedArticlesForNewspaperAction(): Promise<{
  success: boolean;
  data: ArticleSummaryItem[];
}> {
  try {
    const isReady = await isDatabaseAvailable();
    if (isReady) {
      const articles = await prisma.article.findMany({
        where: { status: "PUBLISHED" },
        include: { category: true, location: true, reporter: true },
        orderBy: { publishedAt: "desc" },
        take: 30,
      });

      if (articles.length > 0) {
        return {
          success: true,
          data: articles.map((a) => ({
            id: a.id,
            headline: a.headline,
            subheadline: a.subheadline,
            summary: a.summary,
            bodyMarkdown: a.bodyMarkdown,
            featuredImage: a.featuredImage,
            categoryName: a.category?.nameMarathi || "बातम्या",
            locationName: a.location?.village || "जामखेड",
            publishedAt: a.publishedAt?.toISOString() || null,
            reporterName: a.reporter?.nameMarathi || "विशेष प्रतिनिधी",
          })),
        };
      }
    }
  } catch (err) {
    console.warn("[getPublishedArticlesForNewspaperAction] Error fetching from DB:", err);
  }

  // Graceful fallback to fallback articles
  return {
    success: true,
    data: FALLBACK_ARTICLES.map((a) => ({
      id: a.id,
      headline: a.headline,
      subheadline: a.subheadline,
      summary: a.summary,
      bodyMarkdown: a.bodyMarkdown,
      featuredImage: a.featuredImage,
      categoryName: a.category?.nameMarathi || "स्थानिक घडामोडी",
      locationName: "जामखेड",
      publishedAt: new Date().toISOString(),
      reporterName: "डिजिटल डेस्क",
    })),
  };
}

