"use server";

import prisma, { isDatabaseAvailable } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isReporter, isEditor } from "@/lib/rbac";
import { recordAuditLog } from "@/lib/audit";
import { optimizeImageBuffer, ImageOptimizationOptions } from "@/lib/media/optimizer";
import { storeOptimizedImage, deleteStoredMediaFiles } from "@/lib/media/storage";
import { revalidatePath } from "next/cache";

export interface MediaAssetDTO {
  id: string;
  originalName: string;
  optimizedName: string;
  url: string;
  thumbnailUrl: string | null;
  mimeType: string;
  format: string;
  width: number | null;
  height: number | null;
  originalSize: number;
  optimizedSize: number;
  savedBytes: number;
  savedPercent: number;
  altText: string | null;
  createdAt: string;
  uploaderName?: string;
}

export interface MediaUploadResponse {
  success: boolean;
  message: string;
  assets?: MediaAssetDTO[];
  errors?: string[];
}

/**
 * Uploads, validates, and optimizes one or more image files.
 */
export async function uploadAndOptimizeMediaAction(
  formData: FormData
): Promise<MediaUploadResponse> {
  const user = await getCurrentUser();
  if (!user || !isReporter(user.role)) {
    return {
      success: false,
      message: "अनधिकृत वापर. मीडिया अपलोड करण्यासाठी लॉगिन आवश्यक आहे.",
    };
  }

  const files = formData.getAll("files") as File[];
  if (!files || files.length === 0) {
    const single = formData.get("file") as File;
    if (single) files.push(single);
  }

  if (files.length === 0) {
    return {
      success: false,
      message: "कृपया किमान एक इमेज फाईल निवडा.",
    };
  }

  const preferredFormat = (formData.get("format") as "webp" | "avif") || "webp";
  const customAlt = (formData.get("altText") as string) || "";

  const savedAssets: MediaAssetDTO[] = [];
  const errors: string[] = [];

  const dbReady = await isDatabaseAvailable();

  for (const file of files) {
    if (!file || typeof file.arrayBuffer !== "function") continue;

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const originalName = file.name || "uploaded-image";

      // 1. Optimize image buffer with Sharp
      const optimized = await optimizeImageBuffer(buffer, {
        preferredFormat,
        quality: 82,
        maxWidth: 1920,
      });

      // 2. Persist to storage
      const stored = await storeOptimizedImage(
        optimized.buffer,
        optimized.thumbnailBuffer,
        optimized.format
      );

      // 3. Record in database if DB is ready
      let assetId = `media-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      if (dbReady) {
        try {
          const record = await prisma.mediaAsset.create({
            data: {
              originalName,
              optimizedName: stored.masterFilename,
              url: stored.masterUrl,
              thumbnailUrl: stored.thumbnailUrl,
              mimeType: optimized.mimeType,
              format: optimized.format,
              width: optimized.width,
              height: optimized.height,
              originalSize: optimized.originalSize,
              optimizedSize: optimized.optimizedSize,
              savedBytes: optimized.savedBytes,
              savedPercent: optimized.savedPercent,
              altText: customAlt || originalName.replace(/\.[^/.]+$/, ""),
              uploadedById: user.id,
            },
          });
          assetId = record.id;
        } catch (dbErr: any) {
          console.warn("[Media Asset DB save notice]:", dbErr?.message);
        }
      }

      savedAssets.push({
        id: assetId,
        originalName,
        optimizedName: stored.masterFilename,
        url: stored.masterUrl,
        thumbnailUrl: stored.thumbnailUrl,
        mimeType: optimized.mimeType,
        format: optimized.format,
        width: optimized.width,
        height: optimized.height,
        originalSize: optimized.originalSize,
        optimizedSize: optimized.optimizedSize,
        savedBytes: optimized.savedBytes,
        savedPercent: optimized.savedPercent,
        altText: customAlt || originalName,
        createdAt: new Date().toISOString(),
        uploaderName: user.name,
      });
    } catch (err: any) {
      console.error(`[Upload error on ${file.name}]:`, err);
      errors.push(`${file.name}: ${err?.message || "प्रक्रिया अयशस्वी"}`);
    }
  }

  if (savedAssets.length > 0) {
    try {
      await recordAuditLog({
        userId: user.id,
        action: "MEDIA_UPLOAD",
        entity: "MediaAsset",
        details: {
          count: savedAssets.length,
          totalSavedBytes: savedAssets.reduce((sum, a) => sum + a.savedBytes, 0),
        },
      });
    } catch {}

    revalidatePath("/admin/media");
    return {
      success: true,
      message: `${savedAssets.length} इमेज यशस्वीरित्या ऑप्टिमाइझ व सेव्ह झाल्या!`,
      assets: savedAssets,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  return {
    success: false,
    message: "इमेज ऑप्टिमाइझ करताना त्रुटी आली.",
    errors,
  };
}

/**
 * Lists media library assets with server-side pagination and filters.
 */
export async function getMediaListAction(params: {
  page?: number;
  pageSize?: number;
  query?: string;
  format?: string;
}): Promise<{
  assets: MediaAssetDTO[];
  total: number;
  totalPages: number;
  totalSavedBytes: number;
}> {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(50, Math.max(1, params.pageSize || 24));
  const skip = (page - 1) * pageSize;

  const dbReady = await isDatabaseAvailable();
  if (!dbReady) {
    return { assets: [], total: 0, totalPages: 1, totalSavedBytes: 0 };
  }

  try {
    const where: any = {};
    if (params.query?.trim()) {
      where.OR = [
        { originalName: { contains: params.query.trim(), mode: "insensitive" } },
        { altText: { contains: params.query.trim(), mode: "insensitive" } },
      ];
    }
    if (params.format && params.format !== "ALL") {
      where.format = params.format.toLowerCase();
    }

    const [total, list, aggregate] = await Promise.all([
      prisma.mediaAsset.count({ where }),
      prisma.mediaAsset.findMany({
        where,
        take: pageSize,
        skip,
        orderBy: { createdAt: "desc" },
        include: { uploadedBy: { select: { name: true } } },
      }),
      prisma.mediaAsset.aggregate({
        _sum: { savedBytes: true },
      }),
    ]);

    const formatted: MediaAssetDTO[] = list.map((a) => ({
      id: a.id,
      originalName: a.originalName,
      optimizedName: a.optimizedName,
      url: a.url,
      thumbnailUrl: a.thumbnailUrl,
      mimeType: a.mimeType,
      format: a.format,
      width: a.width,
      height: a.height,
      originalSize: a.originalSize,
      optimizedSize: a.optimizedSize,
      savedBytes: a.savedBytes,
      savedPercent: a.savedPercent,
      altText: a.altText,
      createdAt: a.createdAt.toISOString(),
      uploaderName: a.uploadedBy?.name,
    }));

    return {
      assets: formatted,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      totalSavedBytes: aggregate._sum.savedBytes || 0,
    };
  } catch (err) {
    console.error("[getMediaListAction error]", err);
    return { assets: [], total: 0, totalPages: 1, totalSavedBytes: 0 };
  }
}

/**
 * Updates an asset's alternative text for SEO and accessibility.
 */
export async function updateMediaAltTextAction(
  id: string,
  altText: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || !isReporter(user.role)) {
    return { success: false, error: "अनधिकृत वापर." };
  }

  try {
    await prisma.mediaAsset.update({
      where: { id },
      data: { altText: altText.trim() },
    });
    revalidatePath("/admin/media");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "अपडेट अयशस्वी." };
  }
}

/**
 * Deletes an asset from database and local storage.
 */
export async function deleteMediaAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || !isEditor(user.role)) {
    return { success: false, error: "फक्त संपादकांना मीडिया हटवण्याची परवानगी आहे." };
  }

  try {
    const item = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!item) {
      return { success: false, error: "मीडिया सापडला नाही." };
    }

    // Delete stored files
    await deleteStoredMediaFiles(item.url, item.thumbnailUrl);

    // Delete DB record
    await prisma.mediaAsset.delete({ where: { id } });

    await recordAuditLog({
      userId: user.id,
      action: "MEDIA_DELETE",
      entity: "MediaAsset",
      entityId: id,
      details: { originalName: item.originalName },
    });

    revalidatePath("/admin/media");
    return { success: true };
  } catch (err: any) {
    console.error("[deleteMediaAction error]", err);
    return { success: false, error: err?.message || "हटवताना त्रुटी आली." };
  }
}

