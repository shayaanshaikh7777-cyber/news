import React from "react";
import prisma, { isDatabaseAvailable } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Newspaper, Download, Share2, ExternalLink, Image as ImageIcon, Database } from "lucide-react";
import { CLIPPING_FORMATS, ClippingFormat } from "@/lib/clipping-renderer";
import { FALLBACK_ARTICLES } from "@/lib/fallback-data";

export default async function AdminClippingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const dbReady = await isDatabaseAvailable();
  let articles: any[] = [];

  if (dbReady) {
    try {
      articles = await prisma.article.findMany({
        where: { status: "PUBLISHED" },
        include: { location: true, category: true },
        orderBy: { publishedAt: "desc" },
        take: 15,
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

  const formats: { key: ClippingFormat; label: string; desc: string }[] = [
    { key: "EPAPER", label: "ई-पेपर आवृत्ती (E-Paper)", desc: "1200×1600 दोन कॉलम वर्तमानपत्र लेआउट" },
    { key: "STORY_1080X1920", label: "इन्स्टाग्राम स्टोरी (Story)", desc: "1080×1920 वर्टिकल सोशल स्टोरी" },
    { key: "PORTRAIT_1080X1350", label: "इन्स्टाग्राम पोर्ट्रेट (Portrait)", desc: "1080×1350 सोशल फीड पोस्ट" },
    { key: "SQUARE_1080X1080", label: "स्क्वेअर पोस्ट (Square)", desc: "1080×1080 १:१ सोशल कार्ड" },
    { key: "WHATSAPP", label: "व्हॉट्सॲप कार्ड (WhatsApp)", desc: "1200×630 हॉरिझॉन्टल शेअर कार्ड" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black font-headline text-gray-950 flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-red-700" />
            <span>वृत्तपत्र कात्रण स्टुडिओ (Newspaper Clipping Generator)</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            प्रसिद्ध बातम्यांचे ऑटोमॅटिक वृत्तपत्र कात्रण तयार करा आणि विविध फॉरमॅटमध्ये डाउनलोड करा.
          </p>
        </div>
      </div>

      {!dbReady && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3 text-xs text-amber-900 dark:text-amber-300">
          <Database className="w-5 h-5 flex-shrink-0 text-amber-600" />
          <div>
            <span className="font-bold">डेटाबेस सध्या उपलब्ध नाही (Database Unconfigured):</span>{" "}
            प्रॉडक्शन डेटाबेसमधील लाईव्ह बातम्या लोड करण्यासाठी PostgreSQL DATABASE_URL आवश्यक आहे. (स्थानिक नमुना बातम्या दाखवत आहे).
          </div>
        </div>
      )}

      {/* Available Formats Specs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {formats.map((fmt) => (
          <div key={fmt.key} className="p-3 bg-white rounded-xl border border-gray-200 shadow-xs">
            <h3 className="text-xs font-bold text-gray-900">{fmt.label}</h3>
            <p className="text-[10px] text-gray-500 mt-1">{fmt.desc}</p>
          </div>
        ))}
      </div>

      {/* Published Stories Table with Instant Generate Actions */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-sm font-black font-headline text-gray-900">
            कात्रण तयार करण्यासाठी बातमी निवडा ({articles.length})
          </h2>
        </div>

        <div className="divide-y divide-gray-100 text-xs">
          {articles.map((art) => (
            <div key={art.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-gray-50/60 transition-colors">
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-red-700 uppercase bg-red-50 px-2 py-0.5 rounded mr-2">
                  {art.category?.nameMarathi}
                </span>
                {art.location && (
                  <span className="text-[10px] text-gray-400 mr-2">
                    📍 {art.location.village}
                  </span>
                )}
                <h3 className="text-sm font-bold text-gray-950 mt-1 line-clamp-1">
                  {art.headline}
                </h3>
                <p className="text-[11px] text-gray-500 truncate mt-0.5">{art.summary}</p>
              </div>

              {/* Action Buttons */}
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
    </div>
  );
}

