import React from "react";
import Header from "@/components/public/Header";
import Navbar from "@/components/public/Navbar";
import NewsCard from "@/components/public/NewsCard";
import Footer from "@/components/public/Footer";
import { getTrendingNews, getMostReadToday, getPopularInJamkhed } from "@/lib/trending";
import { Flame, TrendingUp, MapPin, Award } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ट्रेंडिंग व सर्वाधिक वाचलेल्या बातम्या | आवाज जामखेडचा",
  description: "जामखेड, अहिल्यानगर व महाराष्ट्रातील सर्वाधिक वाचलेल्या व चर्चिलेल्या बातम्या.",
};

export const revalidate = 60;

export default async function TrendingPage() {
  const trendingNow = await getTrendingNews(6);
  const mostReadToday = await getMostReadToday(6);
  const popularInJamkhed = await getPopularInJamkhed(6);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {/* Banner */}
        <div className="bg-gradient-to-r from-red-950 via-red-900 to-red-950 text-white p-6 sm:p-8 rounded-2xl mb-8 shadow-sm">
          <div className="flex items-center gap-2 text-yellow-400 font-extrabold text-xs uppercase tracking-wider mb-2">
            <Flame className="w-4 h-4 text-orange-400 animate-bounce" />
            <span>लाइव्ह ट्रेंडिंग अल्गोरिदम</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-headline">
            सर्वाधिक वाचलेल्या व ट्रेंडिंग बातम्या
          </h1>
          <p className="text-sm text-red-100 mt-2 max-w-2xl leading-relaxed">
            वाचकांची संख्या, वाचनाचा वेळ आणि सोशल मीडियावरील शेअर्स यावर आधारित स्वयंचलित मानांकन.
          </p>
        </div>

        {/* 1. Trending Now Section */}
        <section className="mb-12">
          <div className="flex items-center gap-2 pb-3 border-b-2 border-red-800 mb-6">
            <Flame className="w-6 h-6 text-red-700" />
            <h2 className="text-xl sm:text-2xl font-black font-headline text-gray-950">
              सध्या ट्रेंडिंग (Trending Now)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingNow.map((art) => (
              <NewsCard key={art.id} {...art} layout="vertical" />
            ))}
          </div>
        </section>

        {/* 2. Most Read Today */}
        <section className="mb-12">
          <div className="flex items-center gap-2 pb-3 border-b-2 border-orange-600 mb-6">
            <TrendingUp className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl sm:text-2xl font-black font-headline text-gray-950">
              आज सर्वाधिक वाचलेल्या (Most Read Today)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mostReadToday.map((art) => (
              <NewsCard key={art.id} {...art} layout="vertical" />
            ))}
          </div>
        </section>

        {/* 3. Popular in Jamkhed */}
        <section className="mb-12">
          <div className="flex items-center gap-2 pb-3 border-b-2 border-green-700 mb-6">
            <MapPin className="w-6 h-6 text-green-700" />
            <h2 className="text-xl sm:text-2xl font-black font-headline text-gray-950">
              जामखेड तालुक्यात लोकप्रिय (Popular in Jamkhed)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularInJamkhed.map((art) => (
              <NewsCard key={art.id} {...art} layout="vertical" />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

