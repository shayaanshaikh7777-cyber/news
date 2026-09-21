import React from "react";
import prisma, { isDatabaseAvailable } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NewspaperBuilderStudio } from "@/components/admin/newspaper/NewspaperBuilderStudio";
import { FALLBACK_ARTICLES } from "@/lib/fallback-data";
import { ArticleSummaryItem } from "@/types/newspaper";
import { listNewspaperEditionsAction } from "@/actions/newspaper.actions";
import { Newspaper, Download, Share2, Sparkles, Database } from "lucide-react";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ tab?: string; editionId?: string }>;
}

export default async function AdminClippingsPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const resolvedParams = await searchParams;
  const activeTab = resolvedParams.tab || "builder";

  const dbReady = await isDatabaseAvailable();
  let articles: any[] = [];

  if (dbReady) {
    try {
      articles = await prisma.article.findMany({
        where: { status: "PUBLISHED" },
        include: { location: true, category: true, reporter: true },
        orderBy: { publishedAt: "desc" },
        take: 30,
      });
    } catch (e) {
      console.error("[AdminClippingsPage DB error]", e);
    }
  }

  if (articles.length === 0 && !dbReady) {
    articles = FALLBACK_ARTICLES.map((a) => ({
      ...a,
      location: { village: "जामखेड" },
      publishedAt: new Date(),
    }));
  }

  const articleSummaries: ArticleSummaryItem[] = articles.map((a) => ({
    id: a.id,
    headline: a.headline,
    subheadline: a.subheadline,
    summary: a.summary,
    bodyMarkdown: a.bodyMarkdown,
    featuredImage: a.featuredImage,
    categoryName: a.category?.nameMarathi || "स्थानिक घडामोडी",
    locationName: a.location?.village || "जामखेड",
    publishedAt: a.publishedAt ? new Date(a.publishedAt).toISOString() : null,
    reporterName: a.reporter?.nameMarathi || "विशेष प्रतिनिधी",
  }));

  // Fetch saved editions list if on saved tab
  const savedEditionsResult = await listNewspaperEditionsAction();
  const savedEditions = savedEditionsResult.data || [];

  return (
    <div className="space-y-4 font-marathi">
      {/* Studio Mode Selector Navigation */}
      <div className="bg-white border border-gray-200 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-red-800" />
          <h1 className="text-base font-black text-gray-900">
            वृत्तपत्र व ई-पेपर स्टुडिओ (Newspaper & E-Paper Studio)
          </h1>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 text-xs font-bold">
          <Link
            href="/admin/clippings?tab=builder"
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === "builder"
                ? "bg-red-800 text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span>📰 वृत्तपत्र संपादक (Builder)</span>
          </Link>

          <Link
            href="/admin/clippings?tab=single"
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === "single"
                ? "bg-red-800 text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span>✂️ सिंगल बातमी कात्रणे (Quick Clippings)</span>
          </Link>

          <Link
            href="/admin/clippings?tab=saved"
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === "saved"
                ? "bg-red-800 text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span>📁 सेव्ह केलेल्या आवृत्त्या ({savedEditions.length})</span>
          </Link>
        </div>
      </div>

      {/* Database Notice if Offline */}
      {!dbReady && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-900">
          <Database className="w-4 h-4 flex-shrink-0 text-amber-600" />
          <span>
            <strong>डेटाबेस ऑफलाइन मोड:</strong> नमुना बातम्या वापरल्या जात आहेत. स्थानिक पातळीवर सेव्ह व एक्सपोर्ट पूर्णपणे चालू राहील.
          </span>
        </div>
      )}

      {/* TAB 1: MODULAR NEWSPAPER BUILDER STUDIO */}
      {activeTab === "builder" && (
        <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <NewspaperBuilderStudio initialArticles={articleSummaries} />
        </div>
      )}

      {/* TAB 2: BACKWARD-COMPATIBLE QUICK SINGLE CLIPPINGS */}
      {activeTab === "single" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden text-xs">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-black text-gray-900">
              प्रसिद्ध बातम्यांचे १-क्लिक कात्रण डाऊनलोड ({articles.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-100">
            {articles.map((art) => (
              <div
                key={art.id}
                className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-gray-50/60 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-red-700 uppercase bg-red-50 px-2 py-0.5 rounded mr-2">
                    {art.category?.nameMarathi}
                  </span>
                  {art.location && (
                    <span className="text-[10px] text-gray-500 mr-2">
                      📍 {art.location.village}
                    </span>
                  )}
                  <h3 className="text-sm font-bold text-gray-950 mt-1 line-clamp-1">
                    {art.headline}
                  </h3>
                  <p className="text-[11px] text-gray-500 truncate mt-0.5">{art.summary}</p>
                </div>

                {/* Instant Action Downloads */}
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`/api/clippings/generate?articleSlug=${art.slug}&format=EPAPER&exportFormat=png`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 bg-red-800 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-colors shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ई-पेपर (PNG)</span>
                  </a>

                  <a
                    href={`/api/clippings/generate?articleSlug=${art.slug}&format=STORY_1080X1920&exportFormat=png`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 bg-purple-700 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-colors shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>इन्स्टा स्टोरी</span>
                  </a>

                  <a
                    href={`/api/clippings/generate?articleSlug=${art.slug}&format=WHATSAPP&exportFormat=webp`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-colors shadow-xs"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>व्हॉट्सॲप (WebP)</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SAVED EDITIONS */}
      {activeTab === "saved" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden text-xs">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-black text-gray-900">
              सेव्ह केलेल्या वृत्तपत्र आवृत्त्या ({savedEditions.length})
            </h2>
          </div>

          {savedEditions.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Newspaper className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="font-bold text-sm text-gray-700">अद्याप कोणतीही आवृत्ती सेव्ह केलेली नाही.</p>
              <p className="text-xs text-gray-500 mt-1">
                वृत्तपत्र संपादकात जाऊन नवीन आवृत्ती तयार करा आणि 'सेव्ह करा' बटण दाबा.
              </p>
              <Link
                href="/admin/clippings?tab=builder"
                className="mt-4 inline-flex items-center gap-1.5 bg-red-800 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs"
              >
                <span>+ नवीन आवृत्ती तयार करा</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {savedEditions.map((ed) => (
                <div key={ed.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <h3 className="font-bold text-gray-950 text-sm">{ed.title}</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      दिनांक: {ed.editionDate} • एकूण पाने: {ed.pageCount} • दर्जा: {ed.status}
                    </p>
                  </div>

                  <Link
                    href={`/admin/clippings?tab=builder&editionId=${ed.id}`}
                    className="bg-red-800 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs"
                  >
                    संपादक उघडा
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
