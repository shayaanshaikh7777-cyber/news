import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";

export interface StoredMediaPaths {
  masterUrl: string;
  thumbnailUrl: string;
  masterFilename: string;
  thumbnailFilename: string;
  storageTarget: "public" | "tmp";
  dataUrl?: string;
  thumbnailDataUrl?: string;
}

/**
 * Persists an optimized image and its responsive thumbnail to storage.
 * Seamlessly handles:
 * 1. Standard persistent environments (writes to public/uploads/media/...)
 * 2. Read-only serverless environments like Vercel (writes to /tmp/uploads/media/...)
 */
export async function storeOptimizedImage(
  masterBuffer: Buffer,
  thumbnailBuffer: Buffer,
  format: string = "webp"
): Promise<StoredMediaPaths> {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  const relativeDir = path.join("uploads", "media", year, month);
  const hash = crypto.randomBytes(12).toString("hex");
  const masterFilename = `awaaz-${hash}.${format}`;
  const thumbnailFilename = `awaaz-${hash}-thumb.${format}`;

  let storageTarget: "public" | "tmp" = "public";
  let targetDir = path.join(process.cwd(), "public", relativeDir);

  // Check if public/uploads directory is writable
  let canWritePublic = false;
  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const testFile = path.join(targetDir, `.write-test-${hash}`);
    fs.writeFileSync(testFile, "test");
    fs.unlinkSync(testFile);
    canWritePublic = true;
  } catch {
    canWritePublic = false;
  }

  if (!canWritePublic) {
    // Vercel serverless environment has read-only public/ — use os.tmpdir()
    storageTarget = "tmp";
    targetDir = path.join(os.tmpdir(), relativeDir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
  }

  const masterPath = path.join(targetDir, masterFilename);
  const thumbnailPath = path.join(targetDir, thumbnailFilename);

  await fs.promises.writeFile(masterPath, masterBuffer);
  await fs.promises.writeFile(thumbnailPath, thumbnailBuffer);

  // Standard web URLs
  const masterUrl = `/${relativeDir.replace(/\\/g, "/")}/${masterFilename}`;
  const thumbnailUrl = `/${relativeDir.replace(/\\/g, "/")}/${thumbnailFilename}`;

  // Data URLs for instant preview and serverless instance resilience
  const mimeType = format === "avif" ? "image/avif" : `image/${format}`;
  const dataUrl = `data:${mimeType};base64,${masterBuffer.toString("base64")}`;
  const thumbnailDataUrl = `data:image/webp;base64,${thumbnailBuffer.toString("base64")}`;

  return {
    masterUrl,
    thumbnailUrl,
    masterFilename,
    thumbnailFilename,
    storageTarget,
    dataUrl,
    thumbnailDataUrl,
  };
}

/**
 * Safely removes stored files from disk (checking both public and tmp directories).
 */
export async function deleteStoredMediaFiles(
  masterUrl: string,
  thumbnailUrl?: string | null
): Promise<void> {
  const removeUrl = async (urlStr?: string | null) => {
    if (!urlStr || !urlStr.startsWith("/uploads/")) return;
    try {
      const relative = urlStr.replace(/^\//, "").replace(/\//g, path.sep);

      // Check public
      const publicPath = path.join(process.cwd(), "public", relative);
      if (fs.existsSync(publicPath)) {
        await fs.promises.unlink(publicPath).catch(() => {});
      }

      // Check tmp
      const tmpPath = path.join(os.tmpdir(), relative);
      if (fs.existsSync(tmpPath)) {
        await fs.promises.unlink(tmpPath).catch(() => {});
      }
    } catch (e) {
      console.warn("[deleteStoredMediaFiles error]", e);
    }
  };

  await removeUrl(masterUrl);
  if (thumbnailUrl) {
    await removeUrl(thumbnailUrl);
  }
}
