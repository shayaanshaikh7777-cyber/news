import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://awaazjamkhed.com";

  let articles: Array<{ slug: string; updatedAt: Date }> = [];
  let categories: Array<{ slug: string; updatedAt: Date }> = [];
  let locations: Array<{ slug: string; updatedAt: Date }> = [];

  try {
    if (process.env.DATABASE_URL) {
      articles = await prisma.article.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true, publishedAt: true },
        orderBy: { publishedAt: "desc" },
        take: 1000,
      });

      categories = await prisma.category.findMany({
        select: { slug: true, updatedAt: true },
      });

      locations = await prisma.location.findMany({
        select: { slug: true, updatedAt: true },
      });
    }
  } catch (err) {
    console.warn("Sitemap: Database not available during request, returning core pages.", err);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}</loc>
    <changefreq>always</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${siteUrl}/trending</loc>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${siteUrl}/epaper</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${siteUrl}/subscribe</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>

  ${categories
    .map(
      (c) => `
  <url>
    <loc>${siteUrl}/category/${c.slug}</loc>
    <lastmod>${c.updatedAt.toISOString()}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join("")}

  ${locations
    .map(
      (l) => `
  <url>
    <loc>${siteUrl}/location/${l.slug}</loc>
    <lastmod>${l.updatedAt.toISOString()}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.7</priority>
  </url>`
    )
    .join("")}

  ${articles
    .map(
      (a) => `
  <url>
    <loc>${siteUrl}/news/${a.slug}</loc>
    <lastmod>${a.updatedAt.toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`
    )
    .join("")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

