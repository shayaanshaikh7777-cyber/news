import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, MapPin, TrendingUp, Flame, User } from "lucide-react";
import NewsCard, { ArticleCardProps } from "./NewsCard";

interface HeroSectionProps {
  leadArticle: ArticleCardProps;
  sideArticles: ArticleCardProps[];
  trendingList: ArticleCardProps[];
}

export default function HeroSection({
  leadArticle,
  sideArticles = [],
  trendingList = [],
}: HeroSectionProps) {
  if (!leadArticle) return null;

  const leadTime = leadArticle.publishedAt
    ? new Intl.DateTimeFormat("mr-IN", {
        hour: "numeric",
        minute: "numeric",
        day: "numeric",
        month: "short",
      }).format(new Date(leadArticle.publishedAt))
    : "";

  return (
    <section className="w-full py-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top Grid: Lead Story + Side Stories + Trending List */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Hero Column (7 Cols on Desktop) */}
          <div className="lg:col-span-7 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:border-red-600 transition-all">
            <div className="relative aspect-[16/9] w-full bg-gray-900 overflow-hidden group">
              <Image
                src={
                  leadArticle.featuredImage ||
                  "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=1200&auto=format&fit=crop&q=80"
                }
                alt={leadArticle.headline}
                fill
                priority
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

              {/* Badges on image */}
              <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                {leadArticle.category && (
                  <span className="bg-red-800 text-white text-xs font-bold px-3 py-1 rounded shadow">
                    {leadArticle.category.nameMarathi}
                  </span>
                )}
                <span className="bg-yellow-400 text-gray-950 text-xs font-black px-2.5 py-1 rounded shadow uppercase">
                  प्रमुख बातमी
                </span>
              </div>

              {leadArticle.location && (
                <div className="absolute bottom-3 left-4 text-xs text-white/90 font-semibold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-yellow-400" />
                  <span>{leadArticle.location.village}, {leadArticle.location.taluka}</span>
                </div>
              )}
            </div>

            {/* Lead Content Box */}
            <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
              <div>
                <Link href={`/news/${leadArticle.slug}`} className="group">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-950 font-headline group-hover:text-red-800 transition-colors leading-tight">
                    {leadArticle.headline}
                  </h2>
                </Link>

                {leadArticle.subheadline && (
                  <p className="text-sm sm:text-base font-semibold text-red-900 mt-2 line-clamp-2">
                    {leadArticle.subheadline}
                  </p>
                )}

                {leadArticle.summary && (
                  <p className="text-sm sm:text-base text-gray-700 mt-3 line-clamp-3 leading-relaxed">
                    {leadArticle.summary}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-600 mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-red-100 text-red-800 flex items-center justify-center font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 block">
                      {leadArticle.reporter?.nameMarathi || "आवाज जामखेडचा डेस्क"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 font-medium">
                  {leadTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {leadTime}
                    </span>
                  )}
                  <span>• {leadArticle.readingTimeMinutes || 3} मिनिटे वाचन</span>
                  <Link
                    href={`/news/${leadArticle.slug}`}
                    className="bg-red-800 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded text-xs transition-colors"
                  >
                    सविस्तर वाचा &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (5 Cols on Desktop): Side Stories & Trending */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Top 2 Side Stories */}
            <div className="flex flex-col gap-4">
              {sideArticles.slice(0, 2).map((art) => (
                <NewsCard key={art.id} {...art} layout="horizontal" />
              ))}
            </div>

            {/* Trending Now Box */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-2">
                <div className="flex items-center gap-2 text-red-800 font-black text-base">
                  <Flame className="w-5 h-5 text-red-600 animate-bounce" />
                  <span>सर्वाधिक वाचलेल्या बातम्या (Trending)</span>
                </div>
                <Link
                  href="/trending"
                  className="text-xs font-bold text-gray-500 hover:text-red-800 transition-colors"
                >
                  सर्व पाहा &rarr;
                </Link>
              </div>

              <div className="divide-y divide-gray-100">
                {trendingList.slice(0, 4).map((art, idx) => (
                  <div key={art.id} className="py-2.5 flex items-start gap-3 group">
                    <span className="text-2xl font-black text-red-200 group-hover:text-red-800 font-headline leading-none transition-colors w-6 text-center">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <Link href={`/news/${art.slug}`}>
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-red-800 transition-colors leading-snug line-clamp-2">
                          {art.headline}
                        </h4>
                      </Link>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-1">
                        {art.location && <span>📍 {art.location.village}</span>}
                        {art.viewCount ? <span>• {art.viewCount} वाचकांनी पाहिले</span> : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

