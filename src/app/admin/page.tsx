import prisma, {
  isDatabaseAvailable,
  isDatabaseConfiguredCheck,
  getLastDatabaseError,
  getSafeDatabaseInfo,
} from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  CheckCircle,
  Eye,
  Users,
  AlertCircle,
  MousePointerClick,
  TrendingUp,
  DollarSign,
  Plus,
  Clock,
  ChevronRight,
  Sparkles,
  Database,
} from "lucide-react";
import { FALLBACK_ARTICLES, FALLBACK_CATEGORIES } from "@/lib/fallback-data";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isConfigured = isDatabaseConfiguredCheck();
  const dbReady = await isDatabaseAvailable();
  const lastError = getLastDatabaseError();
  const safeDb = getSafeDatabaseInfo();

  let articlesToday = 0;
  let pendingReviews = 0;
  let publishedCount = 0;
  let draftsCount = 0;
  let breakingCount = 0;
  let totalViews = 0;
  let uniqueVisitors = 0;
  let totalImpressions = 0;
  let totalClicks = 0;
  let recentArticles: any[] = [];
  let categoriesWithCount: any[] = [];

  if (dbReady) {
    try {
      const [
        artToday,
        pReviews,
        pubCount,
        dCount,
        bCount,
        adStats,
        viewAggregation,
        rArticles,
        cats,
      ] = await Promise.all([
        prisma.article.count({ where: { createdAt: { gte: today } } }),
        prisma.article.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
        prisma.article.count({ where: { status: "PUBLISHED" } }),
        prisma.article.count({ where: { status: "DRAFT" } }),
        prisma.breakingNews.count({ where: { isActive: true } }),
        prisma.advertisement.aggregate({
          _sum: { impressions: true, clicks: true, campaignRevenue: true },
        }),
        prisma.article.aggregate({
          _sum: { viewCount: true, uniqueVisitors: true },
        }),
        prisma.article.findMany({
          take: 6,
          orderBy: { updatedAt: "desc" },
          include: { category: true, location: true, reporter: true },
        }),
        prisma.category.findMany({
          include: { _count: { select: { articles: true } } },
          orderBy: { sortOrder: "asc" },
        }),
      ]);

      articlesToday = artToday;
      pendingReviews = pReviews;
      publishedCount = pubCount;
      draftsCount = dCount;
      breakingCount = bCount;
      totalViews = viewAggregation._sum.viewCount || 0;
      uniqueVisitors = viewAggregation._sum.uniqueVisitors || 0;
      totalImpressions = adStats._sum.impressions || 0;
      totalClicks = adStats._sum.clicks || 0;
      recentArticles = rArticles;
      categoriesWithCount = cats;
    } catch (err) {
      console.warn("AdminDashboard: Failed to load metrics from DB:", err);
    }
  }

  // Fallbacks if database is unconfigured or returned empty
  if (recentArticles.length === 0) {
    recentArticles = FALLBACK_ARTICLES.slice(0, 6);
    publishedCount = FALLBACK_ARTICLES.length;
    totalViews = 18450;
    uniqueVisitors = 9200;
  }
  if (categoriesWithCount.length === 0) {
    categoriesWithCount = FALLBACK_CATEGORIES.map((c) => ({
      ...c,
      _count: { articles: 3 },
    }));
  }

  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";
  const estimatedRevenue = (totalImpressions / 1000) * 45; // ~₹45 CPM for regional news

  const kpis = [
    { label: "आजच्या बातम्या (Today)", value: articlesToday, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "प्रलंबित पुनरावलोकन (Pending)", value: pendingReviews, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "प्रसिद्ध बातम्या (Published)", value: publishedCount, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
    { label: "एकूण वाचक संख्या (Total Views)", value: totalViews.toLocaleString("en-IN"), icon: Eye, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "युनिक वाचक (Unique Visitors)", value: uniqueVisitors.toLocaleString("en-IN"), icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "सक्रिय ब्रेकिंग न्यूज", value: breakingCount, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
    { label: "जाहिरात इम्प्रेशन्स", value: totalImpressions.toLocaleString("en-IN"), icon: TrendingUp, color: "text-cyan-600", bg: "bg-cyan-50" },
    { label: "जाहिरात क्लिक्स (Clicks)", value: totalClicks.toLocaleString("en-IN"), icon: MousePointerClick, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "सरासरी CTR", value: `${ctr}%`, icon: TrendingUp, color: "text-rose-600", bg: "bg-rose-50" },
    { label: "अंदाजे महसूल (Revenue)", value: `₹${Math.round(estimatedRevenue).toLocaleString("en-IN")}`, icon: DollarSign, color: "text-yellow-600", bg: "bg-yellow-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Database Status Banners: Strictly distinguishes Unconfigured vs Connection Failed */}
      {!isConfigured ? (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-200 text-amber-900 rounded-xl flex-shrink-0 mt-0.5">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-amber-950">
                डेटाबेस अनकॉन्फिगर आहे (Database Not Configured)
              </h3>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                प्रॉडक्शन वातावरणात <code>DATABASE_URL</code> सेट केलेले नाही. कृपया
                <strong> Vercel Project Settings &rarr; Environment Variables</strong> मध्ये <code>DATABASE_URL</code> (उदा. Supabase / Neon PostgreSQL) कॉन्फिगर करा.
              </p>
            </div>
          </div>
          <Link
            href="/admin/settings"
            className="text-xs bg-amber-800 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl whitespace-nowrap transition-colors"
          >
            सेटिंग्ज तपासा &rarr;
          </Link>
        </div>
      ) : !dbReady ? (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-red-200 text-red-900 rounded-xl flex-shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black text-red-950">
                  डेटाबेस कनेक्शन अयशस्वी (Database Connection Failed)
                </h3>
                <span className="bg-red-200 text-red-900 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                  {lastError.code || "CONNECTION_FAILED"}
                </span>
                {safeDb.isPooler && (
                  <span className="bg-blue-100 text-blue-900 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                    Supabase Pooler (Port {safeDb.port || "6543"})
                  </span>
                )}
              </div>
              <p className="text-xs text-red-800 leading-relaxed">
                DATABASE_URL कॉन्फिगर केलेले आहे ({safeDb.host || "host"}:{safeDb.port || "5432"}), परंतु PostgreSQL डेटाबेसशी थेट संपर्क साधता आला नाही.
              </p>
              {safeDb.isMissingProjectRefUser && (
                <div className="text-xs text-amber-950 bg-amber-100/90 border border-amber-300 p-2.5 rounded-xl mt-1 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <span>⚠️</span> Supabase Transaction Pooler युझरनेम दुरुस्ती आवश्यक:
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    तुम्ही पोर्ट 6543 (Transaction Pooler) वापरत आहात. Supabase Pooler साठी युझरनेम फक्त <code>postgres</code> चालत नाही, तर <code>postgres.[तुमचा-प्रकल्प-संदर्भ]</code> (उदा. <code>postgres.vytppjxwrnqvtnrgfpqt</code>) असणे बंधनकारक आहे.
                  </p>
                  <p className="text-[11px] text-amber-900 font-medium">
                    &rarr; Supabase Dashboard &rarr; Project Settings &rarr; Database &rarr; Connection string (Transaction pooler) मधून युझरनेम तपासा आणि Vercel मध्ये DATABASE_URL अपडेट करा.
                  </p>
                </div>
              )}
              {lastError.hint && !safeDb.isMissingProjectRefUser && (
                <p className="text-[11px] text-red-950 font-semibold bg-red-100 p-2 rounded-lg mt-1 border border-red-200">
                  💡 {lastError.hint}
                </p>
              )}
            </div>
          </div>
          <a
            href="/api/health"
            target="_blank"
            className="text-xs bg-red-800 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl whitespace-nowrap transition-colors flex-shrink-0"
          >
            आरोग्य चाचणी (Health Check) &rarr;
          </a>
        </div>
      ) : null}
      {/* Welcome Banner */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-red-700 uppercase tracking-wide">
            दैनिक न्यूजरूम विश्लेषण • जामखेड डेस्क
          </span>
          <h1 className="text-2xl sm:text-3xl font-black font-headline text-gray-950 mt-1">
            नमस्कार, {user.name}
          </h1>
          <p className="text-xs text-gray-600 mt-1">
            आज न्यूजरूममध्ये {pendingReviews} बातम्या मंजुरीच्या प्रतीक्षेत आहेत आणि {breakingCount} ब्रेकिंग न्यूज सक्रिय आहेत.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/ai-studio"
            className="flex items-center gap-1.5 bg-purple-700 hover:bg-purple-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI न्यूज स्टुडिओ</span>
          </Link>
          <Link
            href="/admin/articles/new"
            className="flex items-center gap-1.5 bg-red-800 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>नवीन बातमी तयार करा</span>
          </Link>
        </div>
      </div>

      {/* 10 KPIs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tight line-clamp-1">
                  {kpi.label}
                </span>
                <div className={`p-1.5 rounded-lg ${kpi.bg} ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <span className="text-xl sm:text-2xl font-black text-gray-900 font-headline">
                {kpi.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Charts & Analytics Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Newsroom Workflow Activity (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
            <h2 className="text-base font-black font-headline text-gray-950">
              ताज्या बातम्या व संपादन स्थिती (Recent Editorial Workflow)
            </h2>
            <Link
              href="/admin/articles"
              className="text-xs font-bold text-red-800 hover:underline flex items-center gap-0.5"
            >
              सर्व पाहा <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {recentArticles.map((art) => (
              <div key={art.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                        art.status === "PUBLISHED"
                          ? "bg-green-100 text-green-800"
                          : art.status === "SUBMITTED"
                          ? "bg-amber-100 text-amber-800"
                          : art.status === "UNDER_REVIEW"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {art.status}
                    </span>
                    {art.category && (
                      <span className="text-[11px] text-gray-500 font-semibold">
                        {art.category.nameMarathi}
                      </span>
                    )}
                    {art.location && (
                      <span className="text-[11px] text-gray-400">
                        • {art.location.village}
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/admin/articles/${art.id}/edit`}
                    className="font-bold text-sm text-gray-900 hover:text-red-800 truncate block"
                  >
                    {art.headline}
                  </Link>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    बातमीदार: {art.reporter?.nameMarathi || "न्यूज डेस्क"} • {art.viewCount} व्ह्यूज
                  </p>
                </div>

                <Link
                  href={`/admin/articles/${art.id}/edit`}
                  className="text-xs bg-gray-100 hover:bg-red-800 hover:text-white px-3 py-1.5 rounded font-bold transition-colors whitespace-nowrap"
                >
                  संपादित करा
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Category Distribution & Ad Performance (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Category Performance Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h2 className="text-base font-black font-headline text-gray-950 pb-3 border-b border-gray-200 mb-4">
              विभागनिहाय बातम्या (Category Breakdown)
            </h2>

            <div className="space-y-3">
              {categoriesWithCount.map((cat) => {
                const count = cat._count.articles;
                const percent = publishedCount > 0 ? Math.round((count / publishedCount) * 100) : 0;

                return (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span className="text-gray-800">{cat.nameMarathi}</span>
                      <span className="text-gray-500">
                        {count} बातम्या ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-red-800 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(5, percent))}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Newsroom Actions Card */}
          <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-sm border border-gray-800">
            <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-wider mb-2">
              न्यूजरूम त्वरित कृती (Quick Actions)
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold mt-4">
              <Link
                href="/admin/breaking"
                className="bg-red-700 hover:bg-red-600 p-2.5 rounded-lg text-center transition-colors"
              >
                🚨 ब्रेकिंग न्यूज टाका
              </Link>
              <Link
                href="/admin/clippings"
                className="bg-gray-800 hover:bg-gray-700 p-2.5 rounded-lg text-center transition-colors border border-gray-700"
              >
                📰 कात्रण जनरेट करा
              </Link>
              <Link
                href="/admin/notifications"
                className="bg-gray-800 hover:bg-gray-700 p-2.5 rounded-lg text-center transition-colors border border-gray-700"
              >
                🔔 पुश अलर्ट पाठवा
              </Link>
              <Link
                href="/admin/whatsapp"
                className="bg-green-700 hover:bg-green-600 p-2.5 rounded-lg text-center transition-colors"
              >
                💬 व्हॉट्सॲप ब्रॉडकास्ट
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

