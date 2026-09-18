import React from "react";
import prisma from "@/lib/prisma";
import Header from "@/components/public/Header";
import Navbar from "@/components/public/Navbar";
import BreakingTicker from "@/components/public/BreakingTicker";
import NewsCard from "@/components/public/NewsCard";
import Footer from "@/components/public/Footer";
import { FALLBACK_ARTICLES, FALLBACK_BREAKING } from "@/lib/fallback-data";
import Link from "next/link";
import { Newspaper, Sparkles, Filter } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "सर्व बातम्या (All News) | आवाज जामखेडचा",
  description: "जामखेड, अहिल्यानगर आणि पंचक्रोशीतील सर्व ताज्या घडामोडी, स्थानिक बातम्या व वृत्तांत.",
};

export default async function NewsArchivePage() {
  let articles: any[] = [];
  let breakingItems: any[] = [];

  try {
    if (process.env.DATABASE_URL) {
      articles = await prisma.article.findMany({
        where: { status: "PUBLISHED" },
        include: {
          category: true,
          location: true,
          reporter: true,
        },
        orderBy: { publishedAt: "desc" },
        take: 50,
      });

      breakingItems = await prisma.breakingNews.findMany({
        where: { isActive: true },
        orderBy: { priority: "desc" },
        take: 5,
      });
    }
  } catch (err) {
    console.warn("NewsArchivePage DB query failed, using fallback:", err);
  }

  if (articles.length === 0) {
    articles = FALLBACK_ARTICLES;
  }
  if (breakingItems.length === 0) {
    breakingItems = FALLBACK_BREAKING;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />
      <Navbar />
      <BreakingTicker items={breakingItems} />

      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b-2 border-red-800 mb-6 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-red-800 text-white flex items-center justify-center shadow">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black font-headline text-gray-950">
                सर्व ताज्या बातम्या (All News)
              </h1>
              <p className="text-xs text-gray-500">
                जामखेड, खर्डा, चोंडी व अहिल्यानगर पंचक्रोशीतील सर्व अधिकृत बातम्या
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm self-start sm:self-auto">
            <Filter className="w-3.5 h-3.5 text-red-700" />
            <span>एकूण बातम्या: {articles.length}</span>
          </div>
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-500 font-bold text-base">सध्या कोणतीही बातमी उपलब्ध नाही.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((art) => (
              <NewsCard key={art.id} {...art} layout="vertical" />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

