import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface StoredMediaPaths {
  masterUrl: string;
  thumbnailUrl: string;
  masterFilename: string;
  thumbnailFilename: string;
}

/**
 * Persists an optimized image and its responsive thumbnail to storage.
 * Defaults to local static folder (public/uploads/media/...) with content-addressed hashing.
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
  const absoluteDir = path.join(process.cwd(), "public", relativeDir);

  if (!fs.existsSync(absoluteDir)) {
    fs.mkdirSync(absoluteDir, { recursive: true });
  }

  // Cryptographically unique content hash
  const hash = crypto.randomBytes(12).toString("hex");
  const masterFilename = `awaaz-${hash}.${format}`;
  const thumbnailFilename = `awaaz-${hash}-thumb.${format}`;

  const masterPath = path.join(absoluteDir, masterFilename);
  const thumbnailPath = path.join(absoluteDir, thumbnailFilename);

  await fs.promises.writeFile(masterPath, masterBuffer);
  await fs.promises.writeFile(thumbnailPath, thumbnailBuffer);

  // Return forward-slash web-accessible URLs
  const masterUrl = `/${relativeDir.replace(/\\/g, "/")}/${masterFilename}`;
  const thumbnailUrl = `/${relativeDir.replace(/\\/g, "/")}/${thumbnailFilename}`;

  return {
    masterUrl,
    thumbnailUrl,
    masterFilename,
    thumbnailFilename,
  };
}

/**
 * Safely removes stored files from disk.
 */
export async function deleteStoredMediaFiles(
  masterUrl: string,
  thumbnailUrl?: string | null
): Promise<void> {
  const removeUrl = async (urlStr?: string | null) => {
    if (!urlStr || !urlStr.startsWith("/uploads/")) return;
    try {
      const relative = urlStr.replace(/^\//, "").replace(/\//g, path.sep);
      const abs = path.join(process.cwd(), "public", relative);
      if (fs.existsSync(abs)) {
        await fs.promises.unlink(abs);
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

