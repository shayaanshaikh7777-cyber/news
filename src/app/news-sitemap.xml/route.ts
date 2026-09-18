import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://awaazjamkhed.com";

  // Google News sitemap includes articles published in the last 48 hours
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const articles = await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      publishedAt: { gte: twoDaysAgo },
    },
    include: { category: true },
    orderBy: { publishedAt: "desc" },
    take: 250,
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  ${articles
    .map((a) => {
      const pubDate = a.publishedAt ? a.publishedAt.toISOString() : a.createdAt.toISOString();
      const cleanTitle = (a.headline || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `
  <url>
    <loc>${siteUrl}/news/${a.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>आवाज जामखेडचा (Awaaz Jamkhedcha)</news:name>
        <news:language>mr</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${cleanTitle}</news:title>
    </news:news>
  </url>`;
    })
    .join("")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=1800",
    },
  });
}

