import React from "react";
import prisma from "@/lib/prisma";
import Header from "@/components/public/Header";
import Navbar from "@/components/public/Navbar";
import BreakingTicker from "@/components/public/BreakingTicker";
import Footer from "@/components/public/Footer";
import YouTubePlayer from "@/components/public/YouTubePlayer";
import { FALLBACK_ARTICLES, FALLBACK_BREAKING } from "@/lib/fallback-data";
import Link from "next/link";
import { Video, PlayCircle } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "व्हिडिओ बुलेटिन (Video News) | आवाज जामखेडचा",
  description: "जामखेड, खर्डा, चोंडी व अहिल्यानगर परिसरातील थेट व्हिडिओ ग्राउंड रिपोर्ट्स.",
};

export default async function VideoNewsPage() {
  let videoArticles: any[] = [];
  let breakingItems: any[] = [];

  try {
    if (process.env.DATABASE_URL) {
      videoArticles = await prisma.article.findMany({
        where: {
          status: "PUBLISHED",
          OR: [
            { youtubeUrl: { not: null } },
            { category: { slug: "video-news" } },
          ],
        },
        include: { category: true, location: true, reporter: true },
        orderBy: { publishedAt: "desc" },
        take: 20,
      });

      breakingItems = await prisma.breakingNews.findMany({
        where: { isActive: true },
        take: 5,
      });
    }
  } catch (err) {
    console.warn("VideoNewsPage DB query failed:", err);
  }

  if (videoArticles.length === 0) {
    videoArticles = FALLBACK_ARTICLES.filter(
      (a) => a.youtubeUrl || a.category?.slug === "video-news"
    );
    if (videoArticles.length === 0) {
      videoArticles = FALLBACK_ARTICLES.slice(0, 3);
    }
  }
  if (breakingItems.length === 0) {
    breakingItems = FALLBACK_BREAKING;
  }

  const featuredVideo = videoArticles[0];
  const otherVideos = videoArticles.slice(1);

  return (
    <div className="min-h-screen flex flex-col bg-[#0F172A] text-white">
      <Header />
      <Navbar />
      <BreakingTicker items={breakingItems} />

      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-800 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black font-headline text-white">
              व्हिडिओ बुलेटिन (Video News Desk)
            </h1>
            <p className="text-xs sm:text-sm text-gray-400">
              जामखेड तालुका व अहिल्यानगर जिल्ह्यातील थेट दृश्ये व विशेष मुलाखती
            </p>
          </div>
        </div>

        {/* Featured Top Video */}
        {featuredVideo && (
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-10 shadow-xl">
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black mb-6">
              {featuredVideo.youtubeUrl ? (
                <YouTubePlayer url={featuredVideo.youtubeUrl} title={featuredVideo.headline} />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={featuredVideo.featuredImage || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200"}
                    alt={featuredVideo.headline}
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <PlayCircle className="w-20 h-20 text-red-600 opacity-90 drop-shadow-lg" />
                  </div>
                </div>
              )}
            </div>

            <div>
              <span className="bg-red-700 text-white text-[11px] font-black px-2.5 py-1 rounded uppercase tracking-wider">
                प्रमुख व्हिडिओ वार्ता
              </span>
              <h2 className="text-xl sm:text-2xl font-black font-headline mt-3 text-gray-100">
                {featuredVideo.headline}
              </h2>
              <p className="text-sm text-gray-400 mt-2 line-clamp-3">
                {featuredVideo.summary || featuredVideo.headline}
              </p>
            </div>
          </div>
        )}

        {/* Other Video Grid */}
        <h2 className="text-lg sm:text-xl font-black font-headline text-white mb-4 border-b border-gray-800 pb-2">
          इतर व्हिडिओ रिपोर्ट्स
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {otherVideos.map((art) => (
            <div
              key={art.id}
              className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 group hover:border-gray-700 transition-all"
            >
              <div className="relative aspect-video bg-black">
                <img
                  src={art.featuredImage || "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=600"}
                  alt={art.headline}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <PlayCircle className="w-12 h-12 text-red-500 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div className="p-4">
                <Link href={`/news/${art.slug}`}>
                  <h3 className="text-sm font-bold text-gray-100 group-hover:text-yellow-400 transition-colors line-clamp-2">
                    {art.headline}
                  </h3>
                </Link>
                <p className="text-xs text-gray-400 mt-2 line-clamp-2">{art.summary}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}

