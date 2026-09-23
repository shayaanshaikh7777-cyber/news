"use server";

import prisma, { isDatabaseAvailable } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isReporter } from "@/lib/rbac";
import { recordAuditLog } from "@/lib/audit";
import { VideoProject } from "@/types/video-studio";
import { FALLBACK_ARTICLES } from "@/lib/fallback-data";

export interface SaveProjectResult {
  success: boolean;
  projectId?: string;
  error?: string;
}

export interface VideoProjectSummaryItem {
  id: string;
  title: string;
  canvasRatio: string;
  duration: number;
  status: string;
  updatedAt: string;
  clipCount: number;
  notes?: string;
}

/**
 * Saves a Video Project to database using structured SiteSetting storage.
 * Completely non-destructive: zero migrations, zero database alterations.
 */
export async function saveVideoProjectAction(project: VideoProject): Promise<SaveProjectResult> {
  try {
    const user = await getCurrentUser();
    if (!user || !isReporter(user.role)) {
      return { success: false, error: "अनधिकृत वापर. कृपया लॉगिन करा." };
    }

    if (!project.id || !project.title) {
      return { success: false, error: "प्रकल्पाचे नाव आणि ओळख क्रमांक आवश्यक आहे." };
    }

    const isReady = await isDatabaseAvailable();
    if (!isReady) {
      return { success: false, error: "डेटाबेस ऑफलाइन आहे. स्थानिक ड्राफ्ट सुरक्षित आहे." };
    }

    const key = `video_project_${project.id}`;
    const serialized = JSON.stringify(project);

    await prisma.siteSetting.upsert({
      where: { key },
      update: {
        value: serialized,
        description: `Video Studio Project: ${project.title} (${project.canvasRatio})`,
      },
      create: {
        key,
        value: serialized,
        description: `Video Studio Project: ${project.title} (${project.canvasRatio})`,
      },
    });

    // Update master index of video projects
    const indexKey = "video_projects_index";
    const existingIndex = await prisma.siteSetting.findUnique({
      where: { key: indexKey },
    });

    let indexList: VideoProjectSummaryItem[] = [];
    if (existingIndex?.value) {
      try {
        indexList = JSON.parse(existingIndex.value);
      } catch {
        indexList = [];
      }
    }

    indexList = indexList.filter((p) => p.id !== project.id);
    indexList.unshift({
      id: project.id,
      title: project.title,
      canvasRatio: project.canvasRatio,
      duration: project.duration,
      status: project.status,
      updatedAt: new Date().toISOString(),
      clipCount: project.videoClips.length + project.graphics.length,
      notes: project.notes,
    });

    // Keep top 60 projects in index
    indexList = indexList.slice(0, 60);

    await prisma.siteSetting.upsert({
      where: { key: indexKey },
      update: { value: JSON.stringify(indexList) },
      create: {
        key: indexKey,
        value: JSON.stringify(indexList),
        description: "Index of Video Studio Projects",
      },
    });

    await recordAuditLog({
      userId: user.id,
      action: "SAVE_VIDEO_PROJECT",
      entity: "VideoProject",
      entityId: project.id,
      details: { title: project.title, canvas: project.canvasRatio },
    });

    return { success: true, projectId: project.id };
  } catch (err: unknown) {
    console.error("[saveVideoProjectAction] Error:", err);
    const msg = err instanceof Error ? err.message : "प्रकल्प सेव्ह करताना त्रुटी आली.";
    return { success: false, error: msg };
  }
}

/**
 * Loads a single Video Project by ID.
 */
export async function loadVideoProjectAction(
  id: string
): Promise<{ success: boolean; data?: VideoProject; error?: string }> {
  try {
    const isReady = await isDatabaseAvailable();
    if (!isReady) {
      return { success: false, error: "डेटाबेस सध्या उपलब्ध नाही." };
    }

    const key = `video_project_${id}`;
    const record = await prisma.siteSetting.findUnique({
      where: { key },
    });

    if (!record || !record.value) {
      return { success: false, error: "व्हिडिओ प्रकल्प सापडला नाही." };
    }

    const project: VideoProject = JSON.parse(record.value);
    return { success: true, data: project };
  } catch (err: unknown) {
    console.error("[loadVideoProjectAction] Error:", err);
    return { success: false, error: "प्रकल्प लोड करताना त्रुटी आली." };
  }
}

/**
 * Lists all saved video projects.
 */
export async function listVideoProjectsAction(): Promise<{
  success: boolean;
  data: VideoProjectSummaryItem[];
}> {
  try {
    const isReady = await isDatabaseAvailable();
    if (!isReady) {
      return { success: true, data: [] };
    }

    const record = await prisma.siteSetting.findUnique({
      where: { key: "video_projects_index" },
    });

    if (record?.value) {
      const list = JSON.parse(record.value);
      return { success: true, data: list };
    }

    return { success: true, data: [] };
  } catch (err) {
    console.warn("[listVideoProjectsAction] Error:", err);
    return { success: true, data: [] };
  }
}

/**
 * Deletes a video project by ID.
 */
export async function deleteVideoProjectAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user || !isReporter(user.role)) {
      return { success: false, error: "अनधिकृत वापर." };
    }

    const isReady = await isDatabaseAvailable();
    if (!isReady) {
      return { success: false, error: "डेटाबेस उपलब्ध नाही." };
    }

    // Delete project record
    await prisma.siteSetting.deleteMany({
      where: { key: `video_project_${id}` },
    });

    // Remove from index
    const indexKey = "video_projects_index";
    const existingIndex = await prisma.siteSetting.findUnique({ where: { key: indexKey } });
    if (existingIndex?.value) {
      try {
        let list: VideoProjectSummaryItem[] = JSON.parse(existingIndex.value);
        list = list.filter((p) => p.id !== id);
        await prisma.siteSetting.update({
          where: { key: indexKey },
          data: { value: JSON.stringify(list) },
        });
      } catch {}
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("[deleteVideoProjectAction] Error:", err);
    return { success: false, error: "प्रकल्प हटवताना त्रुटी आली." };
  }
}

/**
 * Generates an editable newsroom video script from an existing published article.
 * Does not overwrite the source article.
 */
export async function createVideoScriptFromArticleAction(articleId: string): Promise<{
  success: boolean;
  script?: {
    openingHook: string;
    headline: string;
    context: string;
    details: string;
    closing: string;
    fullScript: string;
  };
  articleMeta?: {
    headline: string;
    location: string;
    reporterName: string;
    imageUrl?: string;
  };
  error?: string;
}> {
  try {
    let article: any = null;
    const isReady = await isDatabaseAvailable();
    if (isReady) {
      article = await prisma.article.findUnique({
        where: { id: articleId },
        include: { location: true, category: true, reporter: true },
      });
    }

    if (!article) {
      article = FALLBACK_ARTICLES.find((a) => a.id === articleId) || FALLBACK_ARTICLES[0];
    }

    if (!article) {
      return { success: false, error: "बातमी सापडली नाही." };
    }

    const loc = article.location?.village || "जामखेड";
    const reporter = article.reporter?.nameMarathi || "विशेष वार्ताहर";

    const openingHook = `नमस्कार! 'आवाज जामखेडचा'च्या विशेष व्हिडिओ बुलेटिनमध्ये आपले स्वागत.`;
    const headline = article.headline;
    const context = `${loc} येथून मोठी बातमी समोर येत असून, ${article.summary || article.headline}.`;
    const details = article.bodyMarkdown
      .replace(/[#*`>]/g, "")
      .split("\n")
      .filter((l: string) => l.trim().length > 10)
      .slice(0, 3)
      .join(" ");
    const closing = `या संपूर्ण घडामोडींवर आमचे लक्ष आहे. ताज्या अपडेट्ससाठी पाहत राहा 'आवाज जामखेडचा'. धन्यवाद!`;

    const fullScript = `${openingHook} ${headline}. ${context} ${details} ${closing}`;

    return {
      success: true,
      script: {
        openingHook,
        headline,
        context,
        details,
        closing,
        fullScript,
      },
      articleMeta: {
        headline: article.headline,
        location: loc,
        reporterName: reporter,
        imageUrl: article.featuredImage || undefined,
      },
    };
  } catch (err: unknown) {
    console.error("[createVideoScriptFromArticleAction] Error:", err);
    return { success: false, error: "स्क्रिप्ट तयार करताना त्रुटी आली." };
  }
}
