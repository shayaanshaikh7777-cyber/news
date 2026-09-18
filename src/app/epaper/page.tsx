import React from "react";
import prisma from "@/lib/prisma";
import Header from "@/components/public/Header";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import Link from "next/link";
import { Newspaper, Download, Share2, Sparkles, Calendar } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "दैनिक ई-पेपर व बातमी कात्रणे | आवाज जामखेडचा",
  description: "आवाज जामखेडचा अधिकृत डिजिटल ई-पेपर आणि सोशल मीडिया वृत्तपत्र कात्रणे (Clippings).",
};

export const revalidate = 60;

export default async function EPaperPage() {
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    include: { category: true, location: true, reporter: true },
    orderBy: { publishedAt: "desc" },
    take: 12,
  });

  const currentDate = new Intl.DateTimeFormat("mr-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {/* Banner */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-yellow-100 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold mb-2">
              <Newspaper className="w-4 h-4 text-yellow-700" />
              <span>डिजिटल ई-पेपर आवृत्ती</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-headline text-gray-950">
              दैनिक ई-पेपर व कात्रण गॅलरी (E-Paper Clippings)
            </h1>
            <p className="text-sm text-gray-600 mt-2 max-w-2xl leading-relaxed">
              आवाज जामखेडचा च्या कोणत्याही बातमीचे ई-पेपर कात्रण, इन्स्टाग्राम स्टोरी, किंवा व्हॉट्सॲप कार्ड थेट डाउनलोड करा.
            </p>
          </div>

          <div className="text-right bg-gray-50 p-4 rounded-xl border border-gray-200">
            <span className="text-xs text-gray-500 font-semibold block">आजची आवृत्ती:</span>
            <span className="text-base font-bold text-red-900 block mt-0.5">{currentDate}</span>
            <span className="text-xs text-gray-600 block mt-1">जामखेड, अहिल्यानगर</span>
          </div>
        </div>

        {/* Clippings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((art) => (
            <div
              key={art.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col justify-between hover:border-red-700 transition-all hover:shadow-md"
            >
              {/* Fake Newspaper Mini Masthead on Card */}
              <div className="bg-[#FAF8F5] p-4 border-b border-gray-200">
                <div className="flex items-center justify-between text-[11px] text-gray-500 border-b border-gray-300 pb-1 mb-2 font-serif">
                  <span className="font-bold text-red-800">आवाज जामखेडचा ई-कात्रण</span>
                  <span>{art.location?.village || "जामखेड"}</span>
                </div>
                <h3 className="text-base font-black text-gray-950 font-headline line-clamp-2 leading-snug">
                  {art.headline}
                </h3>
                {art.summary && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2 font-serif">
                    {art.summary}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-white border-t border-gray-100 flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <a
                    href={`/api/clippings/generate?articleSlug=${art.slug}&format=EPAPER&exportFormat=png`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1 bg-red-800 hover:bg-red-700 text-white py-2 px-3 rounded-lg text-center transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ई-पेपर (PNG)</span>
                  </a>

                  <a
                    href={`/api/clippings/generate?articleSlug=${art.slug}&format=STORY_1080X1920&exportFormat=png`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1 bg-purple-700 hover:bg-purple-600 text-white py-2 px-3 rounded-lg text-center transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>इन्स्टा स्टोरी</span>
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <a
                    href={`/api/clippings/generate?articleSlug=${art.slug}&format=WHATSAPP&exportFormat=webp`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1 bg-green-700 hover:bg-green-600 text-white py-1.5 px-2 rounded-lg text-center transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>व्हॉट्सॲप (WebP)</span>
                  </a>

                  <Link
                    href={`/news/${art.slug}`}
                    className="flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-1.5 px-2 rounded-lg text-center transition-colors border border-gray-200"
                  >
                    बातमी वाचा &rarr;
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}

