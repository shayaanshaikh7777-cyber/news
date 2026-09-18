export type Role = "SUPER_ADMIN" | "EDITOR" | "REPORTER" | "VIEWER";

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN" as Role,
  EDITOR: "EDITOR" as Role,
  REPORTER: "REPORTER" as Role,
  VIEWER: "VIEWER" as Role,
};

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string | null;
  reporterProfileId?: string | null;
}

export function isSuperAdmin(role?: string | null): boolean {
  return role === ROLES.SUPER_ADMIN;
}

export function isEditor(role?: string | null): boolean {
  return role === ROLES.EDITOR || role === ROLES.SUPER_ADMIN;
}

export function isReporter(role?: string | null): boolean {
  return role === ROLES.REPORTER || role === ROLES.EDITOR || role === ROLES.SUPER_ADMIN;
}

export function canManageUsers(role?: string | null): boolean {
  return isSuperAdmin(role);
}

export function canManageSettings(role?: string | null): boolean {
  return isSuperAdmin(role);
}

export function canPublishArticle(role?: string | null): boolean {
  return isEditor(role);
}

export function canApproveReject(role?: string | null): boolean {
  return isEditor(role);
}

export function canManageBreakingNews(role?: string | null): boolean {
  return isEditor(role);
}

export function canManageAds(role?: string | null): boolean {
  return isSuperAdmin(role);
}

export function canManageWhatsApp(role?: string | null): boolean {
  return isSuperAdmin(role) || isEditor(role);
}

export function canViewAuditLogs(role?: string | null): boolean {
  return isSuperAdmin(role);
}

export function canGenerateClippings(role?: string | null): boolean {
  return isEditor(role);
}

export function canEditArticle(
  user: SessionUser,
  article: { createdById?: string | null; reporterId?: string | null; status: string }
): boolean {
  if (isSuperAdmin(user.role) || isEditor(user.role)) return true;
  if (user.role === ROLES.REPORTER) {
    const isOwner = article.createdById === user.id || (user.reporterProfileId && article.reporterId === user.reporterProfileId);
    // Reporter can edit draft, ai_assisted, or when revision requested
    if (isOwner && ["DRAFT", "AI_ASSISTED", "REVISION_REQUESTED"].includes(article.status)) {
      return true;
    }
  }
  return false;
}

