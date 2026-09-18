import React from "react";
import prisma from "@/lib/prisma";
import Header from "@/components/public/Header";
import Navbar from "@/components/public/Navbar";
import BreakingTicker from "@/components/public/BreakingTicker";
import HeroSection from "@/components/public/HeroSection";
import NewsCard from "@/components/public/NewsCard";
import VillagePicker from "@/components/public/VillagePicker";
import AdSlot from "@/components/public/AdSlot";
import Footer from "@/components/public/Footer";
import { getTrendingNews } from "@/lib/trending";
import Link from "next/link";
import { ChevronRight, Video, Newspaper, MapPin, Sparkles } from "lucide-react";

export const revalidate = 60; // ISR 60s cache

export default async function HomePage() {
  // 1. Breaking News
  const breakingItems = await prisma.breakingNews.findMany({
    where: { isActive: true },
    orderBy: { priority: "desc" },
    take: 5,
  });

  // 2. Published Articles
  const allArticles = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    include: {
      category: true,
      location: true,
      reporter: true,
    },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });

  // 3. Trending Articles
  const trendingList = await getTrendingNews(5);

  // 4. Locations for Village picker
  const locations = await prisma.location.findMany({
    orderBy: { village: "asc" },
  });

  const leadArticle = allArticles[0] || null;
  const sideArticles = allArticles.slice(1, 4);
  const latestFeed = allArticles.slice(4, 10);

  // Filter local Jamkhed news specifically
  const jamkhedLocal = allArticles.filter(
    (a) => a.location?.taluka === "जामखेड" && a.id !== leadArticle?.id
  ).slice(0, 4);

  // Filter video news
  const videoNews = allArticles.filter((a) => a.youtubeUrl || a.category?.slug === "video-news").slice(0, 3);

  // Agriculture news
  const agriNews = allArticles.filter((a) => a.category?.slug === "agriculture").slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      {/* Editorial Header */}
      <Header />

      {/* Main Navigation */}
      <Navbar />

      {/* Breaking News Ticker */}
      <BreakingTicker items={breakingItems} />

      {/* Top Banner Ad */}
      <div className="max-w-7xl mx-auto px-4 w-full">
        <AdSlot placement="HEADER" />
      </div>

      <main className="flex-1">
        {/* Hero Section: Grand Lead Story + Side News + Trending */}
        {leadArticle && (
          <HeroSection
            leadArticle={leadArticle}
            sideArticles={sideArticles}
            trendingList={trendingList as any}
          />
        )}

        {/* Hyper-Local Village News Hub Banner */}
        <div className="max-w-7xl mx-auto px-4">
          <VillagePicker villages={locations} />
        </div>

        {/* Section: Jamkhed Taluka Special Grid */}
        <section className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between pb-3 border-b-2 border-red-800 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-6 bg-red-800 rounded-sm"></span>
              <h2 className="text-xl sm:text-2xl font-black font-headline text-gray-950">
                जामखेड विशेष व पंचक्रोशी (Jamkhed Local News)
              </h2>
            </div>
            <Link
              href="/location/jamkhed-city"
              className="text-xs sm:text-sm font-bold text-red-800 hover:text-red-950 flex items-center gap-1"
            >
              सर्व स्थानिक बातम्या <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {jamkhedLocal.map((art) => (
              <NewsCard key={art.id} {...art} layout="vertical" />
            ))}
          </div>
        </section>

        {/* In-Content Middle Banner Ad */}
        <div className="max-w-7xl mx-auto px-4 w-full my-4">
          <AdSlot placement="ARTICLE_MIDDLE" />
        </div>

        {/* Section: Agriculture & APMC Market Rates */}
        <section className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between pb-3 border-b-2 border-green-700 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-6 bg-green-700 rounded-sm"></span>
              <h2 className="text-xl sm:text-2xl font-black font-headline text-gray-950">
                शेती व बाजारभाव (Agriculture & Mandi Rates)
              </h2>
            </div>
            <Link
              href="/category/agriculture"
              className="text-xs sm:text-sm font-bold text-green-800 hover:text-green-950 flex items-center gap-1"
            >
              कांदा व इतर बाजारभाव <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {agriNews.map((art) => (
              <NewsCard key={art.id} {...art} layout="vertical" />
            ))}
          </div>
        </section>

        {/* Section: Video News Desk */}
        <section className="bg-gray-950 text-white py-10 my-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-700 rounded-lg flex items-center justify-center text-white">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black font-headline text-white">
                    आवाज व्हिडिओ बुलेटिन (Video News)
                  </h2>
                  <p className="text-xs text-gray-400">जामखेड व पंचक्रोशीतील थेट ग्राउंड रिपोर्ट</p>
                </div>
              </div>
              <Link
                href="/category/video-news"
                className="text-xs sm:text-sm font-bold text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
              >
                सर्व व्हिडिओ <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {videoNews.map((art) => (
                <div key={art.id} className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 group">
                  <div className="relative aspect-video">
                    <img
                      src={art.featuredImage || "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=600"}
                      alt={art.headline}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-12 h-10 bg-red-700 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <Video className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <Link href={`/news/${art.slug}`}>
                      <h3 className="text-sm font-bold text-gray-100 group-hover:text-yellow-400 transition-colors line-clamp-2">
                        {art.headline}
                      </h3>
                    </Link>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{art.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section: E-Paper & Daily Clipping Highlights */}
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-yellow-50/70 border border-yellow-200 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-yellow-400 text-gray-950 flex items-center justify-center flex-shrink-0 shadow">
                <Newspaper className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold text-yellow-900 bg-yellow-200/80 px-2 py-0.5 rounded uppercase">
                  डिजिटल ई-पेपर आवृत्ती
                </span>
                <h3 className="text-2xl font-black text-gray-950 font-headline mt-1">
                  वृत्तपत्र कात्रण आणि सोशल मीडिया कार्ड्स (E-Paper Clippings)
                </h3>
                <p className="text-sm text-gray-700 mt-1 max-w-xl">
                  कोणत्याही बातमीचे वृत्तपत्रीय कात्रण एका क्लिकवर तयार करा व इन्स्टाग्राम, फेसबुक, व्हॉट्सॲपवर उच्च गुणवत्तेत शेअर करा.
                </p>
              </div>
            </div>

            <Link
              href="/epaper"
              className="bg-red-800 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all shadow hover:shadow-md whitespace-nowrap"
            >
              ई-पेपर गॅलरी पाहा &rarr;
            </Link>
          </div>
        </section>

        {/* Section: Latest News Timeline Feed */}
        <section className="max-w-7xl mx-auto px-4 py-6 mb-8">
          <div className="pb-3 border-b-2 border-red-800 mb-6">
            <h2 className="text-xl sm:text-2xl font-black font-headline text-gray-950">
              ताज्या घडामोडी (Latest Feed)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {latestFeed.map((art) => (
              <NewsCard key={art.id} {...art} layout="horizontal" />
            ))}
          </div>
        </section>
      </main>

      {/* Editorial Footer */}
      <Footer />
    </div>
  );
}

