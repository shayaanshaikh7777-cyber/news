import { describe, it, expect } from "vitest";
import { canTransitionStatus, ALLOWED_TRANSITIONS } from "../src/lib/workflow";
import { SessionUser, ROLES } from "../src/lib/rbac";

describe("11-Step Newsroom Editorial Workflow State Machine", () => {
  const reporter: SessionUser = {
    id: "rep-1",
    name: "सचिन",
    email: "rep@test.com",
    role: ROLES.REPORTER,
  };

  const editor: SessionUser = {
    id: "ed-1",
    name: "सुनील",
    email: "ed@test.com",
    role: ROLES.EDITOR,
  };

  it("verifies all 11 stages exist in the workflow rules", () => {
    const expectedStages = [
      "DRAFT",
      "AI_ASSISTED",
      "SUBMITTED",
      "UNDER_REVIEW",
      "REVISION_REQUESTED",
      "APPROVED",
      "SCHEDULED",
      "PUBLISHED",
      "UPDATED",
      "ARCHIVED",
      "REJECTED",
    ];

    expectedStages.forEach((stage) => {
      expect(ALLOWED_TRANSITIONS).toHaveProperty(stage);
    });
  });

  it("allows Reporter to move from DRAFT to SUBMITTED", () => {
    const result = canTransitionStatus("DRAFT", "SUBMITTED", reporter);
    expect(result.allowed).toBe(true);
  });

  it("allows Reporter to move from DRAFT to AI_ASSISTED", () => {
    const result = canTransitionStatus("DRAFT", "AI_ASSISTED", reporter);
    expect(result.allowed).toBe(true);
  });

  it("PREVENTS Reporter from directly publishing a DRAFT without Editor review", () => {
    const result = canTransitionStatus("DRAFT", "PUBLISHED", reporter);
    expect(result.allowed).toBe(false);
  });

  it("PREVENTS Reporter from approving an article", () => {
    const result = canTransitionStatus("UNDER_REVIEW", "APPROVED", reporter);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("संपादक");
  });

  it("allows Editor to move SUBMITTED to UNDER_REVIEW", () => {
    const result = canTransitionStatus("SUBMITTED", "UNDER_REVIEW", editor);
    expect(result.allowed).toBe(true);
  });

  it("allows Editor to APPROVE an article under review", () => {
    const result = canTransitionStatus("UNDER_REVIEW", "APPROVED", editor);
    expect(result.allowed).toBe(true);
  });

  it("allows Editor to PUBLISH an approved article", () => {
    const result = canTransitionStatus("APPROVED", "PUBLISHED", editor);
    expect(result.allowed).toBe(true);
  });

  it("allows Editor to SCHEDULE an approved article", () => {
    const result = canTransitionStatus("APPROVED", "SCHEDULED", editor);
    expect(result.allowed).toBe(true);
  });

  it("allows Editor to REQUEST REVISION from Under Review", () => {
    const result = canTransitionStatus("UNDER_REVIEW", "REVISION_REQUESTED", editor);
    expect(result.allowed).toBe(true);
  });

  it("allows moving PUBLISHED article to UPDATED on editorial amendments", () => {
    const result = canTransitionStatus("PUBLISHED", "UPDATED", editor);
    expect(result.allowed).toBe(true);
  });
});

