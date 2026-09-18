import React from "react";
import prisma from "@/lib/prisma";
import Header from "@/components/public/Header";
import Navbar from "@/components/public/Navbar";
import NewsCard from "@/components/public/NewsCard";
import Footer from "@/components/public/Footer";
import { Search, Filter, Calendar } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "बातमी शोध (News Search) | आवाज जामखेडचा",
  description: "जामखेड, तालुका व जिल्हा पातळीवरील बातम्या, शेती आणि स्थानिक घडामोडींचा शोध घ्या.",
};

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    q?: string;
    dateFilter?: string;
    categoryId?: string;
  }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = "", dateFilter = "all", categoryId } = await searchParams;

  const whereClause: Record<string, unknown> = {
    status: "PUBLISHED",
  };

  // Text search query across headline, bodyMarkdown, summary, keywords
  if (q.trim()) {
    whereClause.OR = [
      { headline: { contains: q.trim() } },
      { bodyMarkdown: { contains: q.trim() } },
      { summary: { contains: q.trim() } },
      { seoKeywords: { contains: q.trim() } },
    ];
  }

  // Category filter
  if (categoryId) {
    whereClause.categoryId = categoryId;
  }

  // Date filters: today, week, month
  const now = new Date();
  if (dateFilter === "today") {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    whereClause.publishedAt = { gte: today };
  } else if (dateFilter === "week") {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    whereClause.publishedAt = { gte: weekAgo };
  } else if (dateFilter === "month") {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    whereClause.publishedAt = { gte: monthAgo };
  }

  let articles: any[] = [];
  let categories: any[] = [];

  try {
    if (process.env.DATABASE_URL) {
      articles = await prisma.article.findMany({
        where: whereClause as any,
        include: {
          category: true,
          location: true,
          reporter: true,
        },
        orderBy: { publishedAt: "desc" },
        take: 30,
      });

      categories = await prisma.category.findMany({
        orderBy: { sortOrder: "asc" },
      });
    }
  } catch (err) {
    console.warn("SearchPage DB query failed, using fallback:", err);
  }

  if (categories.length === 0) {
    const { FALLBACK_CATEGORIES } = await import("@/lib/fallback-data");
    categories = FALLBACK_CATEGORIES;
  }

  if (articles.length === 0) {
    const { FALLBACK_ARTICLES } = await import("@/lib/fallback-data");
    if (q.trim()) {
      const term = q.trim().toLowerCase();
      articles = FALLBACK_ARTICLES.filter(
        (a) =>
          a.headline.toLowerCase().includes(term) ||
          a.bodyMarkdown.toLowerCase().includes(term) ||
          a.summary?.toLowerCase().includes(term)
      );
    } else {
      articles = FALLBACK_ARTICLES;
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {/* Search Bar & Filters Form */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
          <h1 className="text-2xl font-black font-headline text-gray-950 mb-4 flex items-center gap-2">
            <Search className="w-6 h-6 text-red-700" />
            <span>बातमी शोध (News Search)</span>
          </h1>

          <form method="GET" action="/search" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="शीर्षक, गाव, विषय किंवा बातमीदार शोधा..."
                className="flex-1 text-sm border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-red-700 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-red-800 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-colors"
              >
                शोधा
              </button>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-600 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-red-800" />
                <span>विभाग:</span>
                <select
                  name="categoryId"
                  defaultValue={categoryId || ""}
                  className="bg-gray-50 border border-gray-300 rounded px-2 py-1 text-xs"
                >
                  <option value="">सर्व विभाग</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameMarathi}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-red-800" />
                <span>कालावधी:</span>
                <select
                  name="dateFilter"
                  defaultValue={dateFilter}
                  className="bg-gray-50 border border-gray-300 rounded px-2 py-1 text-xs"
                >
                  <option value="all">सर्व वेळ</option>
                  <option value="today">आजच्या बातम्या (Today)</option>
                  <option value="week">या आठवड्यातील (This Week)</option>
                  <option value="month">या महिन्यातील (This Month)</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-red-800 mb-6">
          <h2 className="text-lg font-bold text-gray-900">
            {q ? `"${q}" साठी शोध निकाल` : "ताज्या बातम्या"} ({articles.length})
          </h2>
        </div>

        {/* Articles List */}
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((art) => (
              <NewsCard key={art.id} {...art} layout="vertical" />
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 text-center rounded-xl border border-gray-200">
            <p className="text-gray-500 font-medium">
              दिलेल्या माहितीनुसार एकही बातमी सापडली नाही. कृपया वेगळा शब्द वापरून पुन्हा शोधा.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

