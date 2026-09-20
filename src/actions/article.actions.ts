"use server";

import prisma, { isDatabaseAvailable } from "@/lib/prisma";
import { getCurrentUser, verifyDatabaseUser } from "@/lib/auth";
import { Article } from "@prisma/client";
import { isReporter, isEditor, isSuperAdmin, canEditArticle, canPublishArticle } from "@/lib/rbac";
import { transitionArticleStatus, ArticleStatus } from "@/lib/workflow";
import { ArticleFormSchema, LiveUpdateFormSchema } from "@/schemas/article.schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordAuditLog } from "@/lib/audit";
import { resolveExistingCategoryId } from "@/lib/categories";

export async function createAIDraftArticleAction(data: {
  headline: string;
  subheadline?: string;
  summary?: string;
  bodyMarkdown: string;
  categoryId?: string;
  locationId?: string;
  featuredImage?: string;
  slug?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}): Promise<{ success: boolean; draftId?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user || !isReporter(user.role)) {
    return { success: false, error: "अनधिकृत वापर. कृपया लॉगिन करा." };
  }

  try {
    if (!(await isDatabaseAvailable())) {
      return { success: false, error: "डेटाबेस सध्या उपलब्ध नाही (Database Offline)." };
    }

    // Pre-flight database user verification to prevent Article_createdById_fkey violation
    const verifiedUser = await verifyDatabaseUser(user.id, user.email);
    if (!verifiedUser) {
      console.error(`[createAIDraftArticleAction] User not found in DB: id=${user.id}, email=${user.email}`);
      return { success: false, error: "Authenticated user not found. Please sign in again." };
    }

    // Verify category exists in production Category table to prevent Article_categoryId_fkey violation
    const catResolution = await resolveExistingCategoryId(data.categoryId);
    if (!catResolution.success) {
      return { success: false, error: catResolution.error };
    }
    const catId = catResolution.categoryId;

    const cleanSlug =
      data.slug?.trim() ||
      `awaaz-ai-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6)}`;
    const wordCount = (data.bodyMarkdown || "").split(/\s+/).length;
    const readingTime = Math.max(1, Math.round(wordCount / 150));

    const draft = await prisma.article.create({
      data: {
        headline: data.headline.trim(),
        subheadline: data.subheadline?.trim() || null,
        summary: data.summary?.trim() || null,
        bodyMarkdown: data.bodyMarkdown?.trim() || "",
        categoryId: catId,
        locationId: data.locationId || null,
        featuredImage: data.featuredImage?.trim() || null,
        seoTitle: data.seoTitle?.trim() || null,
        seoDescription: data.seoDescription?.trim() || null,
        seoKeywords: data.seoKeywords?.trim() || null,
        createdById: verifiedUser.id,
        status: "DRAFT",
        slug: cleanSlug,
        readingTimeMinutes: readingTime,
        priority: 0,
        isBreaking: false,
      },
    });

    await recordAuditLog({
      userId: verifiedUser.id,
      action: "ARTICLE_CREATED",
      entity: "Article",
      entityId: draft.id,
      details: { headline: draft.headline, source: "AI_STUDIO" },
    });

    revalidatePath("/admin/articles");
    return { success: true, draftId: draft.id };
  } catch (err: unknown) {
    console.error("[createAIDraftArticleAction error]", err);
    const msg = err instanceof Error ? err.message : "मसुदा सेव्ह करताना त्रुटी आली.";
    return { success: false, error: msg };
  }
}

export interface MobileReportInput {
  articleId?: string;
  headline: string;
  notes: string;
  photoUrl?: string;
  youtubeUrl?: string;
  categoryId?: string;
  locationId?: string;
  locationName?: string;
  directPublish?: boolean;
}

export async function createMobileReportAction(data: MobileReportInput): Promise<{
  success: boolean;
  articleId?: string;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user || !isReporter(user.role)) {
    return { success: false, error: "अनधिकृत वापर. कृपया लॉगिन करा." };
  }

  if (!(await isDatabaseAvailable())) {
    return { success: false, error: "डेटाबेस सध्या उपलब्ध नाही (Database Offline)." };
  }

  if (!data.headline?.trim() || !data.notes?.trim()) {
    return { success: false, error: "बातमीचे शीर्षक आणि मजकूर दोन्ही आवश्यक आहेत." };
  }

  try {
    const verifiedUser = await verifyDatabaseUser(user.id, user.email);
    if (!verifiedUser) {
      console.error(`[createMobileReportAction] User not found in DB: id=${user.id}, email=${user.email}`);
      return { success: false, error: "Authenticated user not found. Please sign in again." };
    }

    const isDirect = !!data.directPublish;
    if (isDirect && !canPublishArticle(verifiedUser.role)) {
      return {
        success: false,
        error: "थेट बातमी प्रसिद्ध करण्याचा अधिकार केवळ मुख्य संपादक किंवा प्रशासकाकडे आहे. कृपया बातमी संपादकांकडे सादर करा.",
      };
    }

    let catId = data.categoryId;
    if (catId) {
      const exists = await prisma.category.findUnique({ where: { id: catId } });
      if (!exists) catId = undefined;
    }

    if (!catId) {
      const defaultCategory =
        (await prisma.category.findFirst({
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        })) || (await prisma.category.findFirst());
      catId = defaultCategory?.id;
    }

    if (!catId) {
      return { success: false, error: "कृपया बातमीसाठी किमान एक विभाग (Category) उपलब्ध असणे आवश्यक आहे." };
    }

    // Resolve location ID safely (by ID or village name)
    let locId: string | null = null;
    if (data.locationId) {
      const loc = await prisma.location.findUnique({ where: { id: data.locationId } });
      if (loc) locId = loc.id;
    }
    if (!locId && data.locationName) {
      const loc = await prisma.location.findFirst({
        where: {
          OR: [
            { village: data.locationName },
            { village: { contains: data.locationName } },
          ],
        },
      });
      if (loc) locId = loc.id;
    }

    const wordCount = data.notes.split(/\s+/).length;
    const readingTime = Math.max(1, Math.round(wordCount / 150));

    // Idempotent update if articleId is provided
    if (data.articleId) {
      const existing = await prisma.article.findUnique({
        where: { id: data.articleId },
      });

      if (existing) {
        if (!canEditArticle(verifiedUser, existing)) {
          return { success: false, error: "तुम्हाला ही बातमी संपादित करण्याची परवानगी नाही." };
        }

        const updated = await prisma.article.update({
          where: { id: existing.id },
          data: {
            headline: data.headline.trim(),
            summary: data.headline.trim().slice(0, 200),
            bodyMarkdown: data.notes.trim(),
            featuredImage: data.photoUrl?.trim() || existing.featuredImage || null,
            youtubeUrl: data.youtubeUrl?.trim() || existing.youtubeUrl || null,
            categoryId: catId,
            locationId: locId ?? existing.locationId,
            ...(isDirect
              ? {
                  status: "PUBLISHED",
                  publishedAt: existing.publishedAt || new Date(),
                  publishedById: verifiedUser.id,
                }
              : {}),
          },
        });

        await prisma.articleRevision.create({
          data: {
            articleId: updated.id,
            changedById: verifiedUser.id,
            changeSummary: isDirect
              ? "मोबाईल रिपोर्टरद्वारे थेट प्रसिद्ध केले (Direct Publish Update)"
              : "मोबाईल रिपोर्टरद्वारे अपडेट केले (Mobile Update)",
            diffData: JSON.stringify(updated),
          },
        });

        await recordAuditLog({
          userId: verifiedUser.id,
          action: isDirect ? "ARTICLE_PUBLISHED" : "ARTICLE_UPDATED",
          entity: "Article",
          entityId: updated.id,
          details: { headline: updated.headline, source: "MOBILE_REPORTER", directPublish: isDirect },
        });

        revalidatePath("/admin/articles");
        revalidatePath("/admin");
        revalidatePath("/");
        if (updated.slug) revalidatePath(`/news/${updated.slug}`);

        return { success: true, articleId: updated.id };
      }
    }

    const cleanSlug = `awaaz-mobile-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6)}`;

    const article = await prisma.article.create({
      data: {
        headline: data.headline.trim(),
        summary: data.headline.trim().slice(0, 200),
        bodyMarkdown: data.notes.trim(),
        featuredImage: data.photoUrl?.trim() || null,
        youtubeUrl: data.youtubeUrl?.trim() || null,
        categoryId: catId,
        locationId: locId,
        createdById: verifiedUser.id,
        submittedById: verifiedUser.id,
        reporterId: verifiedUser.reporterProfileId || null,
        status: isDirect ? "PUBLISHED" : "SUBMITTED",
        publishedAt: isDirect ? new Date() : null,
        publishedById: isDirect ? verifiedUser.id : null,
        slug: cleanSlug,
        readingTimeMinutes: readingTime,
        priority: 0,
        isBreaking: false,
      },
    });

    await prisma.articleRevision.create({
      data: {
        articleId: article.id,
        changedById: verifiedUser.id,
        changeSummary: isDirect
          ? "मोबाईल रिपोर्टरद्वारे थेट प्रसिद्ध केले (Direct Publish)"
          : "मोबाईल रिपोर्टरद्वारे सादर केले (Mobile Submission)",
        diffData: JSON.stringify(article),
      },
    });

    await recordAuditLog({
      userId: verifiedUser.id,
      action: isDirect ? "ARTICLE_PUBLISHED" : "ARTICLE_CREATED",
      entity: "Article",
      entityId: article.id,
      details: { headline: article.headline, source: "MOBILE_REPORTER", directPublish: isDirect },
    });

    revalidatePath("/admin/articles");
    revalidatePath("/admin");
    revalidatePath("/");
    if (article.slug) revalidatePath(`/news/${article.slug}`);

    return { success: true, articleId: article.id };
  } catch (err: unknown) {
    console.error("[createMobileReportAction error]", err);
    const msg = err instanceof Error ? err.message : "बातमी सबमिट करताना त्रुटी आली.";
    return { success: false, error: msg };
  }
}

export async function createArticleAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !isReporter(user.role)) {
    redirect("/admin/login");
  }

  if (!(await isDatabaseAvailable())) {
    throw new Error("डेटाबेस उपलब्ध नाही.");
  }

  const verifiedUser = await verifyDatabaseUser(user.id, user.email);
  if (!verifiedUser) {
    console.error(`[createArticleAction] User not found in DB: id=${user.id}, email=${user.email}`);
    throw new Error("Authenticated user not found. Please sign in again.");
  }

  const raw = {
    headline: formData.get("headline") as string,
    subheadline: (formData.get("subheadline") as string) || null,
    summary: (formData.get("summary") as string) || null,
    bodyMarkdown: formData.get("bodyMarkdown") as string,
    featuredImage: (formData.get("featuredImage") as string) || null,
    youtubeUrl: (formData.get("youtubeUrl") as string) || null,
    categoryId: formData.get("categoryId") as string,
    locationId: (formData.get("locationId") as string) || null,
    reporterId: (formData.get("reporterId") as string) || verifiedUser.reporterProfileId || null,
    source: (formData.get("source") as string) || null,
    priority: Number(formData.get("priority") || 0),
    isBreaking: formData.get("isBreaking") === "true" || formData.get("isBreaking") === "on",
    status: (formData.get("status") as string) || "DRAFT",
    seoTitle: (formData.get("seoTitle") as string) || null,
    seoDescription: (formData.get("seoDescription") as string) || null,
    seoKeywords: (formData.get("seoKeywords") as string) || null,
    slug: (formData.get("slug") as string) || null,
  };

  const parsed = ArticleFormSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("[createArticleAction validation error]", parsed.error.format());
    return;
  }

  const catResolution = await resolveExistingCategoryId(parsed.data.categoryId);
  if (!catResolution.success) {
    console.error("[createArticleAction category error]:", catResolution.error);
    return;
  }
  const validCategoryId = catResolution.categoryId;

  const cleanSlug =
    parsed.data.slug?.trim() ||
    `awaaz-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6)}`;

  // Calculate estimated reading time
  const wordCount = parsed.data.bodyMarkdown.split(/\s+/).length;
  const readingTime = Math.max(1, Math.round(wordCount / 150));

  const draftId = formData.get("draftId") as string;
  const requestedStatus = (formData.get("status") as string) || "DRAFT";
  const userIsEditor = isEditor(verifiedUser.role);

  let finalStatus = "DRAFT";
  let publishedAt: Date | null = null;
  let publishedById: string | null = null;
  let submittedById: string | null = null;

  if (requestedStatus === "PUBLISHED" && userIsEditor) {
    finalStatus = "PUBLISHED";
    publishedAt = new Date();
    publishedById = verifiedUser.id;
  } else if (requestedStatus === "SUBMITTED" || (requestedStatus === "PUBLISHED" && !userIsEditor)) {
    finalStatus = "SUBMITTED";
    submittedById = verifiedUser.id;
  }

  let article: Article | null = null;

  if (draftId) {
    const existing = await prisma.article.findUnique({ where: { id: draftId } });
    if (existing && canEditArticle(verifiedUser, existing)) {
      article = await prisma.article.update({
        where: { id: draftId },
        data: {
          ...parsed.data,
          categoryId: validCategoryId,
          status: finalStatus,
          slug: parsed.data.slug?.trim() || existing.slug,
          readingTimeMinutes: readingTime,
          publishedAt: publishedAt || existing.publishedAt,
          publishedById: publishedById || existing.publishedById,
          submittedById: submittedById || existing.submittedById,
        },
      });
    }
  }

  if (!article) {
    article = await prisma.article.create({
      data: {
        ...parsed.data,
        categoryId: validCategoryId,
        status: finalStatus,
        slug: cleanSlug,
        readingTimeMinutes: readingTime,
        createdById: verifiedUser.id,
        publishedAt,
        publishedById,
        submittedById,
      },
    });
  }

  await prisma.articleRevision.create({
    data: {
      articleId: article.id,
      changedById: verifiedUser.id,
      changeSummary: draftId ? "AI मसुदा अद्ययावत केला." : "नवीन बातमी ड्राफ्ट तयार केली.",
      diffData: JSON.stringify(article),
    },
  });

  await recordAuditLog({
    userId: verifiedUser.id,
    action: "ARTICLE_CREATED",
    entity: "Article",
    entityId: article.id,
    details: { headline: article.headline, status: article.status },
  });

  revalidatePath("/");
  revalidatePath("/admin/articles");

  redirect(`/admin/articles/${article.id}/edit`);
}

export async function updateArticleAction(articleId: string, formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    return;
  }

  const verifiedUser = await verifyDatabaseUser(user.id, user.email);
  if (!verifiedUser) {
    console.error(`[updateArticleAction] User not found in DB: id=${user.id}, email=${user.email}`);
    throw new Error("Authenticated user not found. Please sign in again.");
  }

  const existing = await prisma.article.findUnique({
    where: { id: articleId },
  });

  if (!existing) {
    return;
  }

  if (!canEditArticle(verifiedUser, existing)) {
    return;
  }

  const requestedStatus = (formData.get("status") as string) || existing.status;
  const userIsEditor = isEditor(verifiedUser.role);

  let finalStatus = existing.status;
  let publishedAt = existing.publishedAt;
  let publishedById = existing.publishedById;
  let submittedById = existing.submittedById;

  if (requestedStatus === "PUBLISHED" && userIsEditor) {
    finalStatus = "PUBLISHED";
    publishedAt = existing.publishedAt || new Date();
    publishedById = verifiedUser.id;
  } else if (requestedStatus === "SUBMITTED") {
    finalStatus = "SUBMITTED";
    submittedById = verifiedUser.id;
  } else if (requestedStatus === "DRAFT") {
    finalStatus = "DRAFT";
  }

  const raw = {
    headline: formData.get("headline") as string,
    subheadline: (formData.get("subheadline") as string) || null,
    summary: (formData.get("summary") as string) || null,
    bodyMarkdown: formData.get("bodyMarkdown") as string,
    featuredImage: (formData.get("featuredImage") as string) || null,
    youtubeUrl: (formData.get("youtubeUrl") as string) || null,
    categoryId: formData.get("categoryId") as string,
    locationId: (formData.get("locationId") as string) || null,
    reporterId: (formData.get("reporterId") as string) || null,
    source: (formData.get("source") as string) || null,
    priority: Number(formData.get("priority") || 0),
    isBreaking: formData.get("isBreaking") === "true" || formData.get("isBreaking") === "on",
    status: finalStatus,
    seoTitle: (formData.get("seoTitle") as string) || null,
    seoDescription: (formData.get("seoDescription") as string) || null,
    seoKeywords: (formData.get("seoKeywords") as string) || null,
    slug: (formData.get("slug") as string) || existing.slug,
  };

  const parsed = ArticleFormSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("[updateArticleAction validation error]", parsed.error.format());
    return;
  }

  // Check 301 Redirect if slug changed
  const newSlug = parsed.data.slug?.trim() || existing.slug;
  if (newSlug !== existing.slug) {
    await prisma.redirect.upsert({
      where: { sourceSlug: existing.slug },
      update: { destinationSlug: newSlug },
      create: { sourceSlug: existing.slug, destinationSlug: newSlug, statusCode: 301 },
    });
  }

  const wordCount = parsed.data.bodyMarkdown.split(/\s+/).length;
  const readingTime = Math.max(1, Math.round(wordCount / 150));

  const updated = await prisma.article.update({
    where: { id: articleId },
    data: {
      ...parsed.data,
      status: finalStatus,
      publishedAt,
      publishedById,
      submittedById,
      slug: newSlug,
      readingTimeMinutes: readingTime,
    },
  });

  // Record Revision
  await prisma.articleRevision.create({
    data: {
      articleId,
      changedById: verifiedUser.id,
      changeSummary: "बातमीचा मजकूर अद्ययावत केला.",
      diffData: JSON.stringify({ old: existing, updated }),
    },
  });

  await recordAuditLog({
    userId: verifiedUser.id,
    action: "ARTICLE_UPDATED",
    entity: "Article",
    entityId: articleId,
    details: { headline: updated.headline },
  });

  revalidatePath("/");
  revalidatePath(`/news/${newSlug}`);
  revalidatePath("/admin/articles");
  revalidatePath(`/admin/articles/${articleId}/edit`);
}

export async function changeWorkflowStatusAction(params: {
  articleId: string;
  targetStatus: ArticleStatus;
  changeSummary: string;
  scheduledAt?: string | null;
}): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    return;
  }

  try {
    const scheduledDate = params.scheduledAt ? new Date(params.scheduledAt) : null;
    const updated = await transitionArticleStatus({
      articleId: params.articleId,
      targetStatus: params.targetStatus,
      user,
      changeSummary: params.changeSummary,
      scheduledAt: scheduledDate,
    });

    revalidatePath("/");
    revalidatePath(`/news/${updated.slug}`);
    revalidatePath("/admin/articles");
    revalidatePath(`/admin/articles/${params.articleId}/edit`);
  } catch (err: unknown) {
    console.error("Workflow status change error:", err);
  }
}

export async function addLiveUpdateAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !isEditor(user.role)) {
    return;
  }

  const verifiedUser = await verifyDatabaseUser(user.id, user.email);
  if (!verifiedUser) {
    return;
  }

  const articleId = formData.get("articleId") as string;
  const content = formData.get("content") as string;
  const authorName = (formData.get("authorName") as string) || verifiedUser.name;

  const parsed = LiveUpdateFormSchema.safeParse({ articleId, content, authorName });
  if (!parsed.success) {
    return;
  }

  const liveUpdate = await prisma.liveUpdate.create({
    data: {
      articleId: parsed.data.articleId,
      content: parsed.data.content,
      authorName: parsed.data.authorName,
    },
  });

  await recordAuditLog({
    userId: verifiedUser.id,
    action: "LIVE_UPDATE_ADDED",
    entity: "LiveUpdate",
    entityId: liveUpdate.id,
    details: { articleId, content },
  });

  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (article) {
    revalidatePath(`/news/${article.slug}`);
    revalidatePath(`/admin/articles/${articleId}/edit`);
  }
}
