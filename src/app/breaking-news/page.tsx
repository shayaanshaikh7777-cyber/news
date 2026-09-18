import React from "react";
import prisma from "@/lib/prisma";
import Header from "@/components/public/Header";
import Navbar from "@/components/public/Navbar";
import BreakingTicker from "@/components/public/BreakingTicker";
import Footer from "@/components/public/Footer";
import { FALLBACK_BREAKING, FALLBACK_ARTICLES } from "@/lib/fallback-data";
import Link from "next/link";
import { Flame, Clock, ArrowRight, Bell, AlertTriangle } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ब्रेकिंग न्यूज (Breaking News) | आवाज जामखेडचा",
  description: "जामखेड आणि पंचक्रोशीतील महत्त्वाच्या ताज्या घडामोडी व तत्काळ बातम्या.",
};

export default async function BreakingNewsPage() {
  let breakingItems: any[] = [];
  let relatedNews: any[] = [];

  try {
    if (process.env.DATABASE_URL) {
      breakingItems = await prisma.breakingNews.findMany({
        where: { isActive: true },
        orderBy: { priority: "desc" },
      });

      relatedNews = await prisma.article.findMany({
        where: { status: "PUBLISHED", isBreaking: true },
        include: { category: true, location: true, reporter: true },
        orderBy: { publishedAt: "desc" },
        take: 10,
      });
    }
  } catch (err) {
    console.warn("BreakingNewsPage DB query failed:", err);
  }

  if (breakingItems.length === 0) {
    breakingItems = FALLBACK_BREAKING;
  }
  if (relatedNews.length === 0) {
    relatedNews = FALLBACK_ARTICLES.filter((a) => a.isBreaking);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />
      <Navbar />
      <BreakingTicker items={breakingItems} />

      <main className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full">
        <div className="flex items-center gap-3 pb-4 border-b-2 border-red-800 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md animate-pulse">
            <Flame className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black font-headline text-gray-950">
              लाईव्ह ब्रेकिंग न्यूज (Live Breaking Desk)
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
              जामखेड तालुका, अहिल्यानगर आणि पंचक्रोशीतील महत्त्वपूर्ण घडामोडी
            </p>
          </div>
        </div>

        {/* Live Alerts List */}
        <div className="space-y-4">
          {breakingItems.map((item, index) => (
            <div
              key={item.id || index}
              className="bg-white border-l-4 border-red-600 rounded-xl p-5 shadow-sm hover:shadow transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <span className="bg-red-100 text-red-800 text-[11px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider flex-shrink-0 mt-0.5">
                  ब्रेकिंग #{index + 1}
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-950 leading-snug">
                    {item.title}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>तत्काळ अपडेट</span>
                  </p>
                </div>
              </div>

              {item.linkUrl && (
                <Link
                  href={item.linkUrl}
                  className="inline-flex items-center gap-1 text-xs font-bold text-red-700 hover:text-red-900 self-start sm:self-center whitespace-nowrap bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <span>सविस्तर वाचा</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Telegram & WhatsApp Alert Subscribe Box */}
        <div className="mt-10 bg-red-950 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-800 flex items-center justify-center flex-shrink-0">
              <Bell className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-lg font-black font-headline text-white">
                मोफत ब्रेकिंग न्यूज सूचना मिळवा
              </h3>
              <p className="text-xs text-gray-300 mt-1 max-w-md">
                कोणतीही मोठी घटना घडल्यास थेट आपल्या मोबाईलवर सूचना प्राप्त करा.
              </p>
            </div>
          </div>
          <Link
            href="/subscribe"
            className="bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors whitespace-nowrap"
          >
            सूचना सुरू करा &rarr;
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

