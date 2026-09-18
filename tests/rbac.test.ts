import { describe, it, expect } from "vitest";
import {
  isSuperAdmin,
  isEditor,
  isReporter,
  canManageUsers,
  canPublishArticle,
  canEditArticle,
  SessionUser,
  ROLES,
} from "../src/lib/rbac";

describe("RBAC Permissions and Role Hierarchy", () => {
  const superAdminUser: SessionUser = {
    id: "usr-admin",
    name: "सुपर ॲडमीन",
    email: "admin@test.com",
    role: ROLES.SUPER_ADMIN,
  };

  const editorUser: SessionUser = {
    id: "usr-editor",
    name: "संपादक",
    email: "editor@test.com",
    role: ROLES.EDITOR,
  };

  const reporterUser: SessionUser = {
    id: "usr-reporter",
    name: "सचिन वारे",
    email: "reporter@test.com",
    role: ROLES.REPORTER,
    reporterProfileId: "rep-1",
  };

  const viewerUser: SessionUser = {
    id: "usr-viewer",
    name: "वाचक",
    email: "viewer@test.com",
    role: ROLES.VIEWER,
  };

  it("identifies Super Admin correctly", () => {
    expect(isSuperAdmin(superAdminUser.role)).toBe(true);
    expect(isSuperAdmin(editorUser.role)).toBe(false);
    expect(isSuperAdmin(reporterUser.role)).toBe(false);
    expect(isSuperAdmin(viewerUser.role)).toBe(false);
  });

  it("identifies Editor correctly", () => {
    expect(isEditor(superAdminUser.role)).toBe(true);
    expect(isEditor(editorUser.role)).toBe(true);
    expect(isEditor(reporterUser.role)).toBe(false);
    expect(isEditor(viewerUser.role)).toBe(false);
  });

  it("identifies Reporter correctly", () => {
    expect(isReporter(superAdminUser.role)).toBe(true);
    expect(isReporter(editorUser.role)).toBe(true);
    expect(isReporter(reporterUser.role)).toBe(true);
    expect(isReporter(viewerUser.role)).toBe(false);
  });

  it("enforces user management access strictly for Super Admin", () => {
    expect(canManageUsers(superAdminUser.role)).toBe(true);
    expect(canManageUsers(editorUser.role)).toBe(false);
    expect(canManageUsers(reporterUser.role)).toBe(false);
    expect(canManageUsers(viewerUser.role)).toBe(false);
  });

  it("enforces publishing authority strictly for Editor and Super Admin", () => {
    expect(canPublishArticle(superAdminUser.role)).toBe(true);
    expect(canPublishArticle(editorUser.role)).toBe(true);
    expect(canPublishArticle(reporterUser.role)).toBe(false);
    expect(canPublishArticle(viewerUser.role)).toBe(false);
  });

  it("allows reporters to edit only their own drafts or revision requests", () => {
    const ownDraft = { createdById: "usr-reporter", reporterId: "rep-1", status: "DRAFT" };
    const ownRevision = { createdById: "usr-reporter", reporterId: "rep-1", status: "REVISION_REQUESTED" };
    const ownPublished = { createdById: "usr-reporter", reporterId: "rep-1", status: "PUBLISHED" };
    const otherDraft = { createdById: "other-user", reporterId: "other-rep", status: "DRAFT" };

    expect(canEditArticle(reporterUser, ownDraft)).toBe(true);
    expect(canEditArticle(reporterUser, ownRevision)).toBe(true);
    // Reporters cannot directly edit published stories (must be approved by Editor)
    expect(canEditArticle(reporterUser, ownPublished)).toBe(false);
    // Reporters cannot edit another user's stories
    expect(canEditArticle(reporterUser, otherDraft)).toBe(false);

    // Editors and Super Admins can edit any story
    expect(canEditArticle(editorUser, otherDraft)).toBe(true);
    expect(canEditArticle(superAdminUser, ownPublished)).toBe(true);
  });

  it("denies all edit access to viewers", () => {
    const anyArticle = { createdById: "any", reporterId: "any", status: "DRAFT" };
    expect(canEditArticle(viewerUser, anyArticle)).toBe(false);
  });
});

