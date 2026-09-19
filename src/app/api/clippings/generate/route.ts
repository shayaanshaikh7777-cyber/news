import { NextRequest, NextResponse } from "next/server";
import prisma, { isDatabaseAvailable } from "@/lib/prisma";
import { generateClippingImage, ClippingFormat } from "@/lib/clipping-renderer";
import { FALLBACK_ARTICLES } from "@/lib/fallback-data";
import fs from "fs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("articleSlug");
    const format = (searchParams.get("format") || "EPAPER") as ClippingFormat;
    const exportFormat = (searchParams.get("exportFormat") || "png") as "png" | "webp";

    if (!slug) {
      return NextResponse.json({ error: "articleSlug is required" }, { status: 400 });
    }

    let article: any = null;
    try {
      if (await isDatabaseAvailable()) {
        article = await prisma.article.findUnique({
          where: { slug },
        });
      }
    } catch {
      // Fall through to fallback articles
    }

    if (!article) {
      article = FALLBACK_ARTICLES.find((a) => a.slug === slug);
    }

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const { fullPath, relativeUrl } = await generateClippingImage({
      articleId: article.id,
      format,
      exportFormat,
    });

    // Stream image binary directly so the browser can download or preview
    const fileBuffer = fs.readFileSync(fullPath);
    const contentType = exportFormat === "webp" ? "image/webp" : "image/png";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="awaaz-jamkhedcha-${slug}.${exportFormat}"`,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error generating clipping";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

