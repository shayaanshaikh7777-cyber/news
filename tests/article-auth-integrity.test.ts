import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/lib/prisma", async (importOriginal) => {
  const actual = (await importOriginal()) as object;
  return {
    ...actual,
    default: {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
        count: vi.fn(),
      },
      article: {
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
      },
      category: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        count: vi.fn(),
      },
      location: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
      },
      articleRevision: {
        create: vi.fn(),
      },
      mediaAsset: {
        create: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
    },
    isDatabaseAvailable: vi.fn().mockResolvedValue(true),
  };
});

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import prisma from "../src/lib/prisma";
import { verifyDatabaseUser } from "../src/lib/auth";
import {
  createAIDraftArticleAction,
  createMobileReportAction,
  createArticleAction,
} from "../src/actions/article.actions";
import { transitionArticleStatus } from "../src/lib/workflow";
import { uploadAndOptimizeMediaAction } from "../src/actions/media.actions";
import * as authModule from "../src/lib/auth";
import { ROLES, SessionUser } from "../src/lib/rbac";

describe("P0 Data-Integrity: PostgreSQL User Resolution & Foreign Key Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validRealUser = {
    id: "cm_real_user_cuid_123",
    name: "सुनील कांबळे (संपादक)",
    email: "editor@test.com",
    role: "EDITOR",
    status: "ACTIVE",
    avatar: null,
    reporterProfile: null,
  };

  const validMasterAdmin = {
    id: "cm_master_admin_cuid_999",
    name: "मुख्य संपादक (Master Admin)",
    email: "admin@test.com",
    role: "SUPER_ADMIN",
    status: "ACTIVE",
    avatar: null,
    reporterProfile: null,
  };

  // 1. Valid user ID resolution
  it("resolves a valid active user by PostgreSQL primary key ID", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(validRealUser as any);

    const user = await verifyDatabaseUser("cm_real_user_cuid_123", "editor@test.com");
    expect(user).not.toBeNull();
    expect(user?.id).toBe("cm_real_user_cuid_123");
    expect(user?.email).toBe("editor@test.com");
    expect(user?.role).toBe("EDITOR");
  });

  // 2. Legacy admin-master session resolution
  it("safely recovers legacy 'admin-master' session by resolving real PostgreSQL User.id via email", async () => {
    // ID lookup for 'admin-master' should be skipped, query by email returns real cuid
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(validMasterAdmin as any);

    const user = await verifyDatabaseUser("admin-master", "admin@test.com");
    expect(user).not.toBeNull();
    // Must NEVER be 'admin-master'
    expect(user?.id).not.toBe("admin-master");
    expect(user?.id).toBe("cm_master_admin_cuid_999");
  });

  // 3. Missing user
  it("returns null when user ID and email do not exist in PostgreSQL", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const user = await verifyDatabaseUser("cm_unknown_id", "unknown@test.com");
    expect(user).toBeNull();
  });

  // 4. Invalid user ID / Inactive user
  it("returns null for inactive or suspended users", async () => {
    const inactiveUser = {
      ...validRealUser,
      status: "INACTIVE",
    };
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(inactiveUser as any);

    const user = await verifyDatabaseUser("cm_real_user_cuid_123", "editor@test.com");
    expect(user).toBeNull();
  });

  // 5. AI article creation with verified user
  it("creates AI article draft using the genuine verified User.id in createdById", async () => {
    const sessionUser: SessionUser = {
      id: "cm_real_user_cuid_123",
      name: "सुनील कांबळे",
      email: "editor@test.com",
      role: ROLES.EDITOR,
    };
    vi.spyOn(authModule, "getCurrentUser").mockResolvedValue(sessionUser);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(validRealUser as any);
    vi.mocked(prisma.category.findUnique).mockResolvedValue({
      id: "cat_politics_id",
      name: "Politics",
      nameMarathi: "राजकारण",
      isActive: true,
    } as any);
    vi.mocked(prisma.category.count).mockResolvedValue(5 as any);
    vi.mocked(prisma.article.create).mockResolvedValue({
      id: "art_ai_draft_1",
      headline: "जामखेड पाणीपुरवठा योजना मंजूर",
      createdById: "cm_real_user_cuid_123",
    } as any);

    const res = await createAIDraftArticleAction({
      headline: "जामखेड पाणीपुरवठा योजना मंजूर",
      bodyMarkdown: "जामखेड शहरासाठी नवीन योजना...",
      categoryId: "cat_politics_id",
    });

    expect(res.success).toBe(true);
    expect(prisma.article.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          createdById: "cm_real_user_cuid_123",
        }),
      })
    );
  });

  // 6. AI article creation with missing user (prevents raw Article_createdById_fkey error)
  it("returns clear application error when authenticated user is missing from DB during AI draft creation", async () => {
    const sessionUser: SessionUser = {
      id: "cm_nonexistent_user",
      name: "अज्ञात",
      email: "ghost@test.com",
      role: ROLES.REPORTER,
    };
    vi.spyOn(authModule, "getCurrentUser").mockResolvedValue(sessionUser);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const res = await createAIDraftArticleAction({
      headline: "चाचणी बातमी",
      bodyMarkdown: "चाचणी मजकूर...",
    });

    expect(res.success).toBe(false);
    expect(res.error).toBe("Authenticated user not found. Please sign in again.");
    expect(prisma.article.create).not.toHaveBeenCalled();
  });

  // 7. Normal article creation with missing user
  it("aborts normal article creation when user is not found in database", async () => {
    const sessionUser: SessionUser = {
      id: "cm_ghost_id",
      name: "Ghost User",
      email: "ghost@test.com",
      role: ROLES.REPORTER,
    };
    vi.spyOn(authModule, "getCurrentUser").mockResolvedValue(sessionUser);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const formData = new FormData();
    formData.set("headline", "वैध बातमी शीर्षक किमान वीस अक्षरे");
    formData.set("bodyMarkdown", "हे बातमीचे संपूर्ण वर्णन आहे जे पुरेशा लांबीचे आहे.");
    formData.set("categoryId", "cat-1");

    await expect(createArticleAction(formData)).rejects.toThrow(
      "Authenticated user not found. Please sign in again."
    );
    expect(prisma.article.create).not.toHaveBeenCalled();
  });

  // 8. Mobile reporter article creation with missing user
  it("rejects mobile reporter submission when user is missing from DB", async () => {
    const sessionUser: SessionUser = {
      id: "cm_ghost_reporter",
      name: "Ghost Reporter",
      email: "ghost@test.com",
      role: ROLES.REPORTER,
    };
    vi.spyOn(authModule, "getCurrentUser").mockResolvedValue(sessionUser);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const res = await createMobileReportAction({
      headline: "मोबाईल बातमी",
      notes: "मोबाईल बातमीचे टिपण...",
    });

    expect(res.success).toBe(false);
    expect(res.error).toBe("Authenticated user not found. Please sign in again.");
    expect(prisma.article.create).not.toHaveBeenCalled();
  });

  // 9. Workflow status transition actor verification
  it("uses verifiedUser.id for status transition actor fields and revision tracking", async () => {
    const sessionUser: SessionUser = {
      id: "cm_real_user_cuid_123",
      name: "सुनील कांबळे",
      email: "editor@test.com",
      role: ROLES.EDITOR,
    };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(validRealUser as any);
    vi.mocked(prisma.article.findUnique).mockResolvedValue({
      id: "art_existing_1",
      status: "APPROVED",
      publishedAt: null,
    } as any);
    vi.mocked(prisma.article.update).mockResolvedValue({
      id: "art_existing_1",
      status: "PUBLISHED",
    } as any);

    await transitionArticleStatus({
      articleId: "art_existing_1",
      targetStatus: "PUBLISHED",
      user: sessionUser,
      changeSummary: "थेट प्रसिद्ध केले",
    });

    expect(prisma.article.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "art_existing_1" },
        data: expect.objectContaining({
          publishedById: "cm_real_user_cuid_123",
        }),
      })
    );

    expect(prisma.articleRevision.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          changedById: "cm_real_user_cuid_123",
        }),
      })
    );
  });

  // 10. Media upload with missing user
  it("rejects media upload when authenticated user is not in database", async () => {
    const sessionUser: SessionUser = {
      id: "cm_ghost_media",
      name: "Ghost Uploader",
      email: "ghost@test.com",
      role: ROLES.REPORTER,
    };
    vi.spyOn(authModule, "getCurrentUser").mockResolvedValue(sessionUser);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const formData = new FormData();
    const fakeFile = new File(["test image content"], "photo.jpg", { type: "image/jpeg" });
    formData.append("files", fakeFile);

    const res = await uploadAndOptimizeMediaAction(formData);
    expect(res.success).toBe(false);
    expect(res.message).toBe("Authenticated user not found. Please sign in again.");
    expect(prisma.mediaAsset.create).not.toHaveBeenCalled();
  });

  // 11. Mobile reporter direct publish by Editor / Super Admin
  it("allows direct publish from mobile reporter when user has publish permission", async () => {
    const sessionUser: SessionUser = {
      id: "cm_real_user_cuid_123",
      name: "सुनील कांबळे (संपादक)",
      email: "editor@test.com",
      role: ROLES.EDITOR,
    };
    vi.spyOn(authModule, "getCurrentUser").mockResolvedValue(sessionUser);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(validRealUser as any);
    vi.mocked(prisma.category.findFirst).mockResolvedValue({
      id: "cat_local_news",
      name: "Local",
      nameMarathi: "स्थानिक",
      isActive: true,
    } as any);
    vi.mocked(prisma.location.findFirst).mockResolvedValue({
      id: "loc_jamkhed_id",
      village: "जामखेड शहर",
      taluka: "जामखेड",
    } as any);
    vi.mocked(prisma.article.create).mockResolvedValue({
      id: "art_mobile_pub_1",
      headline: "जामखेड बस स्थानकाजवळ नवीन स्वच्छतागृह सुरू",
      status: "PUBLISHED",
      publishedById: "cm_real_user_cuid_123",
      createdById: "cm_real_user_cuid_123",
    } as any);

    const res = await createMobileReportAction({
      headline: "जामखेड बस स्थानकाजवळ नवीन स्वच्छतागृह सुरू",
      notes: "जामखेड शहर बस स्थानक परिसरात प्रवाशांच्या सोयीसाठी नवीन स्वच्छतागृह सुरू करण्यात आले आहे.",
      locationName: "जामखेड शहर",
      directPublish: true,
    });

    expect(res.success).toBe(true);
    expect(prisma.article.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "PUBLISHED",
          publishedById: "cm_real_user_cuid_123",
          publishedAt: expect.any(Date),
          createdById: "cm_real_user_cuid_123",
          locationId: "loc_jamkhed_id",
        }),
      })
    );
  });

  // 12. Mobile reporter direct publish rejected for pure Reporter (RBAC protection)
  it("rejects direct publish from mobile reporter when user is pure REPORTER without publish role", async () => {
    const reporterUser = {
      id: "cm_field_reporter_456",
      name: "प्रमोद कदम (रिपोर्टर)",
      email: "reporter@test.com",
      role: "REPORTER" as const,
      status: "ACTIVE",
      avatar: null,
      reporterProfile: null,
    };
    const sessionUser: SessionUser = {
      id: "cm_field_reporter_456",
      name: "प्रमोद कदम",
      email: "reporter@test.com",
      role: ROLES.REPORTER,
    };
    vi.spyOn(authModule, "getCurrentUser").mockResolvedValue(sessionUser);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(reporterUser as any);

    const res = await createMobileReportAction({
      headline: "अनधिकृत थेट प्रसिद्धी चाचणी",
      notes: "या बातमीला थेट प्रसिद्ध करण्याची परवानगी नसावी.",
      directPublish: true,
    });

    expect(res.success).toBe(false);
    expect(res.error).toBe(
      "थेट बातमी प्रसिद्ध करण्याचा अधिकार केवळ मुख्य संपादक किंवा प्रशासकाकडे आहे. कृपया बातमी संपादकांकडे सादर करा."
    );
    expect(prisma.article.create).not.toHaveBeenCalled();
  });

  // 13. Mobile reporter idempotent update with existing articleId
  it("updates existing article idempotently when articleId is passed in mobile reporter", async () => {
    const sessionUser: SessionUser = {
      id: "cm_real_user_cuid_123",
      name: "सुनील कांबळे",
      email: "editor@test.com",
      role: ROLES.EDITOR,
    };
    vi.spyOn(authModule, "getCurrentUser").mockResolvedValue(sessionUser);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(validRealUser as any);
    vi.mocked(prisma.category.findFirst).mockResolvedValue({
      id: "cat_local_news",
      isActive: true,
    } as any);
    vi.mocked(prisma.article.findUnique).mockResolvedValue({
      id: "art_existing_mobile_99",
      headline: "जुने शीर्षक",
      bodyMarkdown: "जुना मजकूर",
      createdById: "cm_real_user_cuid_123",
      status: "SUBMITTED",
      featuredImage: null,
    } as any);
    vi.mocked(prisma.article.update).mockResolvedValue({
      id: "art_existing_mobile_99",
      headline: "अपडेटेड शीर्षक",
      bodyMarkdown: "अपडेटेड मजकूर",
      status: "PUBLISHED",
    } as any);

    const res = await createMobileReportAction({
      articleId: "art_existing_mobile_99",
      headline: "अपडेटेड शीर्षक",
      notes: "अपडेटेड मजकूर",
      directPublish: true,
    });

    expect(res.success).toBe(true);
    expect(res.articleId).toBe("art_existing_mobile_99");
    expect(prisma.article.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "art_existing_mobile_99" },
        data: expect.objectContaining({
          headline: "अपडेटेड शीर्षक",
          bodyMarkdown: "अपडेटेड मजकूर",
          status: "PUBLISHED",
          publishedById: "cm_real_user_cuid_123",
        }),
      })
    );
    // Should NOT create another new article
    expect(prisma.article.create).not.toHaveBeenCalled();
  });
});

