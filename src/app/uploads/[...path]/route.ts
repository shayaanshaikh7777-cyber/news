import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import prisma, { isDatabaseAvailable } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolved = await params;
    if (!resolved.path || resolved.path.length === 0) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const subPath = resolved.path.join(path.sep);
    const webPath = `/uploads/${resolved.path.join("/")}`;
    const filename = resolved.path[resolved.path.length - 1];

    // Helper to get mime type from extension
    const getContentType = (filepath: string) => {
      const ext = path.extname(filepath).slice(1).toLowerCase();
      switch (ext) {
        case "webp":
          return "image/webp";
        case "png":
          return "image/png";
        case "jpg":
        case "jpeg":
          return "image/jpeg";
        case "avif":
          return "image/avif";
        default:
          return "application/octet-stream";
      }
    };

    // 1. Try public/uploads (local dev / persistent disk)
    const publicFile = path.join(process.cwd(), "public", "uploads", subPath);
    if (fs.existsSync(publicFile)) {
      const buffer = fs.readFileSync(publicFile);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": getContentType(publicFile),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    // 2. Try os.tmpdir()/uploads (Vercel serverless /tmp)
    const tmpFile = path.join(os.tmpdir(), "uploads", subPath);
    if (fs.existsSync(tmpFile)) {
      const buffer = fs.readFileSync(tmpFile);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": getContentType(tmpFile),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    // 3. Try database MediaAsset record (cross-container serverless fallback)
    if (await isDatabaseAvailable()) {
      try {
        const asset = await prisma.mediaAsset.findFirst({
          where: {
            OR: [
              { optimizedName: filename },
              { url: webPath },
              { thumbnailUrl: webPath },
            ],
          },
        });

        if (asset) {
          const dataUri =
            asset.thumbnailUrl?.startsWith("data:")
              ? asset.thumbnailUrl
              : asset.url?.startsWith("data:")
              ? asset.url
              : null;

          if (dataUri) {
            const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
              const mime = match[1];
              const buffer = Buffer.from(match[2], "base64");
              return new NextResponse(buffer, {
                headers: {
                  "Content-Type": mime,
                  "Cache-Control": "public, max-age=31536000, immutable",
                },
              });
            }
          }
        }
      } catch (dbErr) {
        console.warn("[Media Route DB lookup notice]:", dbErr);
      }
    }

    return new NextResponse("Image not found", { status: 404 });
  } catch (err) {
    console.error("[Media Route Error]:", err);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

