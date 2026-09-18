import prisma from "./prisma";
import { SessionUser, isEditor, isSuperAdmin } from "./rbac";
import { recordAuditLog } from "./audit";

export type ArticleStatus =
  | "DRAFT"
  | "AI_ASSISTED"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "REVISION_REQUESTED"
  | "APPROVED"
  | "SCHEDULED"
  | "PUBLISHED"
  | "UPDATED"
  | "ARCHIVED"
  | "REJECTED";

export const ALLOWED_TRANSITIONS: Record<ArticleStatus, ArticleStatus[]> = {
  DRAFT: ["AI_ASSISTED", "SUBMITTED", "ARCHIVED"],
  AI_ASSISTED: ["DRAFT", "SUBMITTED", "ARCHIVED"],
  SUBMITTED: ["UNDER_REVIEW", "REVISION_REQUESTED", "REJECTED", "DRAFT"],
  UNDER_REVIEW: ["APPROVED", "REVISION_REQUESTED", "REJECTED", "SUBMITTED"],
  REVISION_REQUESTED: ["SUBMITTED", "DRAFT"],
  APPROVED: ["SCHEDULED", "PUBLISHED", "UNDER_REVIEW"],
  SCHEDULED: ["PUBLISHED", "APPROVED", "UNDER_REVIEW"],
  PUBLISHED: ["UPDATED", "ARCHIVED"],
  UPDATED: ["PUBLISHED", "ARCHIVED"],
  ARCHIVED: ["DRAFT", "PUBLISHED"],
  REJECTED: ["DRAFT", "ARCHIVED"],
};

export function canTransitionStatus(
  currentStatus: ArticleStatus,
  targetStatus: ArticleStatus,
  user: SessionUser
): { allowed: boolean; reason?: string } {
  const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(targetStatus)) {
    return {
      allowed: false,
      reason: `सध्याच्या '${currentStatus}' स्थितीवरून '${targetStatus}' स्थितीमध्ये बदल करता येत नाही.`,
    };
  }

  // Permission checks
  if (["APPROVED", "SCHEDULED", "PUBLISHED", "REJECTED"].includes(targetStatus)) {
    if (!isEditor(user.role)) {
      return {
        allowed: false,
        reason: "केवळ संपादक किंवा ॲडमीन ही स्थिती बदलू शकतात.",
      };
    }
  }

  if (targetStatus === "ARCHIVED") {
    if (!isEditor(user.role)) {
      return {
        allowed: false,
        reason: "बातमी अर्काईव्ह करण्याची परवानगी केवळ संपादकांना आहे.",
      };
    }
  }

  return { allowed: true };
}

export async function transitionArticleStatus(params: {
  articleId: string;
  targetStatus: ArticleStatus;
  user: SessionUser;
  changeSummary: string;
  scheduledAt?: Date | null;
}) {
  const { articleId, targetStatus, user, changeSummary, scheduledAt } = params;

  const article = await prisma.article.findUnique({
    where: { id: articleId },
  });

  if (!article) {
    throw new Error("बातमी सापडली नाही.");
  }

  const check = canTransitionStatus(article.status as ArticleStatus, targetStatus, user);
  if (!check.allowed) {
    throw new Error(check.reason);
  }

  const updateData: Record<string, unknown> = {
    status: targetStatus,
  };

  if (targetStatus === "SUBMITTED") {
    updateData.submittedById = user.id;
  } else if (targetStatus === "UNDER_REVIEW") {
    updateData.reviewedById = user.id;
  } else if (targetStatus === "APPROVED") {
    updateData.approvedById = user.id;
  } else if (targetStatus === "SCHEDULED") {
    updateData.approvedById = user.id;
    if (scheduledAt) {
      updateData.scheduledAt = scheduledAt;
    }
  } else if (targetStatus === "PUBLISHED") {
    updateData.publishedById = user.id;
    updateData.publishedAt = article.publishedAt || new Date();
  }

  const updatedArticle = await prisma.article.update({
    where: { id: articleId },
    data: updateData,
  });

  // Save Revision
  await prisma.articleRevision.create({
    data: {
      articleId,
      changedById: user.id,
      changeSummary: changeSummary || `स्थिती बदल: ${article.status} -> ${targetStatus}`,
      diffData: JSON.stringify({
        from: article.status,
        to: targetStatus,
        updatedFields: updateData,
      }),
    },
  });

  // Record Audit Log
  await recordAuditLog({
    userId: user.id,
    action: `ARTICLE_STATUS_${targetStatus}`,
    entity: "Article",
    entityId: articleId,
    details: { from: article.status, to: targetStatus, summary: changeSummary },
  });

  return updatedArticle;
}

