"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isReporter, isEditor, isSuperAdmin, canEditArticle } from "@/lib/rbac";
import { transitionArticleStatus, ArticleStatus } from "@/lib/workflow";
import { ArticleFormSchema, LiveUpdateFormSchema } from "@/schemas/article.schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordAuditLog } from "@/lib/audit";

export async function createArticleAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !isReporter(user.role)) {
    redirect("/admin/login");
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
    reporterId: (formData.get("reporterId") as string) || user.reporterProfileId || null,
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
    return;
  }

  const cleanSlug =
    parsed.data.slug?.trim() ||
    `awaaz-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6)}`;

  // Calculate estimated reading time
  const wordCount = parsed.data.bodyMarkdown.split(/\s+/).length;
  const readingTime = Math.max(1, Math.round(wordCount / 150));

  const article = await prisma.article.create({
    data: {
      ...parsed.data,
      slug: cleanSlug,
      readingTimeMinutes: readingTime,
      createdById: user.id,
      submittedById: parsed.data.status === "SUBMITTED" ? user.id : null,
    },
  });

  await prisma.articleRevision.create({
    data: {
      articleId: article.id,
      changedById: user.id,
      changeSummary: "नवीन बातमी ड्राफ्ट तयार केली.",
      diffData: JSON.stringify(article),
    },
  });

  await recordAuditLog({
    userId: user.id,
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

  const existing = await prisma.article.findUnique({
    where: { id: articleId },
  });

  if (!existing) {
    return;
  }

  if (!canEditArticle(user, existing)) {
    return;
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
    status: existing.status,
    seoTitle: (formData.get("seoTitle") as string) || null,
    seoDescription: (formData.get("seoDescription") as string) || null,
    seoKeywords: (formData.get("seoKeywords") as string) || null,
    slug: (formData.get("slug") as string) || existing.slug,
  };

  const parsed = ArticleFormSchema.safeParse(raw);
  if (!parsed.success) {
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
      slug: newSlug,
      readingTimeMinutes: readingTime,
    },
  });

  // Record Revision
  await prisma.articleRevision.create({
    data: {
      articleId,
      changedById: user.id,
      changeSummary: "बातमीचा मजकूर अद्ययावत केला.",
      diffData: JSON.stringify({ old: existing, updated }),
    },
  });

  await recordAuditLog({
    userId: user.id,
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

  const articleId = formData.get("articleId") as string;
  const content = formData.get("content") as string;
  const authorName = (formData.get("authorName") as string) || user.name;

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
    userId: user.id,
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
