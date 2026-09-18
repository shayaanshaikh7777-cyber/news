import React from "react";
import prisma from "@/lib/prisma";
import Header from "@/components/public/Header";
import Navbar from "@/components/public/Navbar";
import BreakingTicker from "@/components/public/BreakingTicker";
import SocialShare from "@/components/public/SocialShare";
import YouTubePlayer from "@/components/public/YouTubePlayer";
import LiveUpdates from "@/components/public/LiveUpdates";
import AdSlot from "@/components/public/AdSlot";
import NewsCard from "@/components/public/NewsCard";
import ViewCounter from "@/components/public/ViewCounter";
import Footer from "@/components/public/Footer";
import { generateNewsArticleJSONLD, generateOrganizationJSONLD } from "@/lib/seo";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, User, Calendar, CheckCircle2, Share2, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await prisma.article.findUnique({
    where: { slug },
    include: { category: true, reporter: true },
  });

  if (!article) {
    return { title: "बातमी आढळली नाही | आवाज जामखेडचा" };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://awaazjamkhed.com";
  const title = article.seoTitle || `${article.headline} | आवाज जामखेडचा`;
  const description = article.seoDescription || article.summary || article.headline;
  const imgUrl = article.featuredImage || `${appUrl}/og-image.jpg`;

  return {
    title,
    description,
    alternates: {
      canonical: `${appUrl}/news/${article.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${appUrl}/news/${article.slug}`,
      siteName: "आवाज जामखेडचा",
      locale: "mr_IN",
      type: "article",
      publishedTime: article.publishedAt?.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      authors: [article.reporter?.nameMarathi || "विशेष प्रतिनिधी"],
      section: article.category?.nameMarathi,
      images: [{ url: imgUrl, width: 1200, height: 630, alt: article.headline }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imgUrl],
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;

  // Check 301 Redirects first if slug was changed
  const redirectEntry = await prisma.redirect.findUnique({
    where: { sourceSlug: slug },
  });
  if (redirectEntry) {
    redirect(`/news/${redirectEntry.destinationSlug}`);
  }

  const article = await prisma.article.findUnique({
    where: { slug },
    include: {
      category: true,
      location: true,
      reporter: true,
      liveUpdates: true,
    },
  });

  if (!article || article.status !== "PUBLISHED") {
    notFound();
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://awaazjamkhed.com";
  const articleUrl = `${appUrl}/news/${article.slug}`;

  // JSON-LD Schemas
  const newsArticleJsonLd = generateNewsArticleJSONLD({
    headline: article.headline,
    description: article.summary || article.headline,
    imageUrl: article.featuredImage,
    datePublished: article.publishedAt?.toISOString() || article.createdAt.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    authorName: article.reporter?.nameMarathi || "आवाज जामखेडचा डेस्क",
    articleUrl,
    categoryName: article.category?.nameMarathi || "बातम्या",
  });

  const organizationJsonLd = generateOrganizationJSONLD();

  // Related Articles (same category)
  const relatedArticles = await prisma.article.findMany({
    where: {
      categoryId: article.categoryId,
      id: { not: article.id },
      status: "PUBLISHED",
    },
    include: { category: true, location: true, reporter: true },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  // Location Articles (same village/taluka)
  const locationArticles = article.locationId
    ? await prisma.article.findMany({
        where: {
          locationId: article.locationId,
          id: { not: article.id },
          status: "PUBLISHED",
        },
        include: { category: true, location: true, reporter: true },
        take: 3,
      })
    : [];

  // Breaking News
  const breakingItems = await prisma.breakingNews.findMany({
    where: { isActive: true },
    take: 3,
  });

  const timePublished = article.publishedAt
    ? new Intl.DateTimeFormat("mr-IN", {
        dateStyle: "full",
        timeStyle: "short",
      }).format(new Date(article.publishedAt))
    : "";

  const timeUpdated = new Intl.DateTimeFormat("mr-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(article.updatedAt));

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      {/* Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      {/* Analytics View Tracker */}
      <ViewCounter articleId={article.id} />

      <Header />
      <Navbar />
      <BreakingTicker items={breakingItems} />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        {/* Breadcrumb Bar */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 overflow-x-auto">
          <Link href="/" className="hover:text-red-800 font-semibold">
            मुख्य पृष्ठ
          </Link>
          <span>/</span>
          {article.category && (
            <>
              <Link
                href={`/category/${article.category.slug}`}
                className="hover:text-red-800 font-semibold"
              >
                {article.category.nameMarathi}
              </Link>
              <span>/</span>
            </>
          )}
          {article.location && (
            <>
              <Link
                href={`/location/${article.location.slug}`}
                className="hover:text-red-800 font-semibold"
              >
                {article.location.village}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-gray-800 truncate font-bold">{article.headline}</span>
        </div>

        {/* 12-Column Editorial Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Article Content (8 Cols on Desktop) */}
          <article className="lg:col-span-8 bg-white p-5 sm:p-8 rounded-xl border border-gray-200 shadow-sm">
            {/* Category and Location Badges */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {article.category && (
                <Link
                  href={`/category/${article.category.slug}`}
                  className="bg-red-800 text-white text-xs font-bold px-2.5 py-1 rounded"
                >
                  {article.category.nameMarathi}
                </Link>
              )}
              {article.location && (
                <Link
                  href={`/location/${article.location.slug}`}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold px-2.5 py-1 rounded flex items-center gap-1"
                >
                  <MapPin className="w-3.5 h-3.5 text-red-700" />
                  <span>{article.location.village}, {article.location.taluka}</span>
                </Link>
              )}
              {article.isBreaking && (
                <span className="bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded uppercase animate-pulse">
                  ब्रेकिंग
                </span>
              )}
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-gray-950 font-headline leading-tight">
              {article.headline}
            </h1>

            {/* Subheadline (Dek) */}
            {article.subheadline && (
              <p className="text-base sm:text-xl font-semibold text-red-900 mt-3 leading-snug">
                {article.subheadline}
              </p>
            )}

            {/* Newspaper Byline Strip */}
            <div className="newspaper-byline flex flex-wrap items-center justify-between gap-3 text-xs text-gray-600 mt-4 mb-6">
              <div className="flex items-center gap-3">
                {article.reporter ? (
                  <Link
                    href={`/reporter/${article.reporter.id}`}
                    className="flex items-center gap-2 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-900 flex items-center justify-center font-bold">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 group-hover:text-red-800 block">
                        {article.reporter.nameMarathi}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {article.reporter.designation}
                      </span>
                    </div>
                  </Link>
                ) : (
                  <span className="font-bold text-gray-900">
                    विशेष वार्ताहर, आवाज जामखेडचा
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:items-end text-[11px] text-gray-500">
                <span className="flex items-center gap-1 font-semibold text-gray-700">
                  <Calendar className="w-3 h-3 text-red-800" />
                  प्रसिद्ध: {timePublished}
                </span>
                <span>अपडेट: {timeUpdated} • {article.readingTimeMinutes} मि. वाचन</span>
              </div>
            </div>

            {/* Top Share Controls */}
            <SocialShare
              headline={article.headline}
              url={articleUrl}
              slug={article.slug}
            />

            {/* Hero Media: Image or Embedded YouTube */}
            {article.featuredImage && (
              <div className="my-6 rounded-xl overflow-hidden relative aspect-[16/9] bg-gray-100 border border-gray-200">
                <Image
                  src={article.featuredImage}
                  alt={article.headline}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 65vw"
                />
              </div>
            )}

            {/* YouTube Video Player Embed if provided */}
            {article.youtubeUrl && (
              <YouTubePlayer url={article.youtubeUrl} title={article.headline} />
            )}

            {/* Key Takeaways Box if available */}
            {article.summary && (
              <div className="my-6 bg-red-50/70 border-l-4 border-red-800 p-4 rounded-r-lg">
                <h4 className="text-xs font-black uppercase tracking-wider text-red-900 flex items-center gap-1.5 mb-1.5">
                  <CheckCircle2 className="w-4 h-4 text-red-700" />
                  महत्त्वाचा सारांश (Key Summary):
                </h4>
                <p className="text-sm sm:text-base font-semibold text-gray-900 leading-relaxed">
                  {article.summary}
                </p>
              </div>
            )}

            {/* Chronological Live Updates Timeline (if active) */}
            {article.liveUpdates && article.liveUpdates.length > 0 && (
              <LiveUpdates updates={article.liveUpdates} />
            )}

            {/* Main Article Body (Rich text / Markdown) */}
            <div className="marathi-body mt-6 prose prose-red max-w-none text-gray-900">
              {article.bodyMarkdown.split("\n\n").map((para, idx) => {
                // Insert an in-content ad slot after paragraph 2
                if (idx === 2) {
                  return (
                    <React.Fragment key={idx}>
                      <p>{para}</p>
                      <AdSlot placement="ARTICLE_MIDDLE" />
                    </React.Fragment>
                  );
                }
                return <p key={idx}>{para}</p>;
              })}
            </div>

            {/* In-Content Bottom Banner Ad */}
            <AdSlot placement="ARTICLE_BOTTOM" />

            {/* Bottom Share Controls */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                ही महत्त्वाची बातमी आपल्या मित्रांना आणि व्हॉट्सॲप ग्रुपवर शेअर करा:
              </p>
              <SocialShare
                headline={article.headline}
                url={articleUrl}
                slug={article.slug}
              />
            </div>

            {/* Reporter Bio Profile Card */}
            {article.reporter && (
              <div className="my-8 p-5 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                <div className="w-16 h-16 rounded-full bg-red-800 text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
                  <User className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <Link
                      href={`/reporter/${article.reporter.id}`}
                      className="text-lg font-bold text-gray-950 hover:text-red-800"
                    >
                      {article.reporter.nameMarathi}
                    </Link>
                    <span className="text-xs text-red-700 font-semibold bg-red-100 px-2 py-0.5 rounded-full inline-block">
                      {article.reporter.designation}
                    </span>
                  </div>
                  {article.reporter.bio && (
                    <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                      {article.reporter.bio}
                    </p>
                  )}
                  <div className="mt-3">
                    <Link
                      href={`/reporter/${article.reporter.id}`}
                      className="text-xs font-bold text-red-800 hover:underline inline-flex items-center gap-1"
                    >
                      या बातमीदाराच्या सर्व बातम्या पाहा &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </article>

          {/* Right Sidebar (4 Cols on Desktop) */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Sticky Social Share on Desktop */}
            <div className="hidden lg:block">
              <SocialShare
                headline={article.headline}
                url={articleUrl}
                slug={article.slug}
                isSticky
              />
            </div>

            {/* Sidebar Ad Placement */}
            <AdSlot placement="SIDEBAR" />

            {/* Related News from Category */}
            {relatedArticles.length > 0 && (
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-base font-black font-headline text-gray-950 pb-2 border-b-2 border-red-800 mb-3">
                  याच विभागातील इतर महत्त्वाच्या बातम्या
                </h3>
                <div className="divide-y divide-gray-100">
                  {relatedArticles.map((art) => (
                    <NewsCard key={art.id} {...art} layout="compact" />
                  ))}
                </div>
              </div>
            )}

            {/* More from Same Location (Village) */}
            {locationArticles.length > 0 && (
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-base font-black font-headline text-gray-950 pb-2 border-b-2 border-red-800 mb-3">
                  {article.location?.village} परिसरातील इतर घडामोडी
                </h3>
                <div className="divide-y divide-gray-100">
                  {locationArticles.map((art) => (
                    <NewsCard key={art.id} {...art} layout="compact" />
                  ))}
                </div>
              </div>
            )}

            {/* WhatsApp Newsletter Sidebar Widget */}
            <div className="bg-gradient-to-br from-green-950 to-green-900 text-white p-5 rounded-xl shadow-sm border border-green-800">
              <h4 className="font-bold text-base text-green-200 flex items-center gap-2">
                <span>💬</span> आवाज जामखेडचा व्हॉट्सॲप बुलेटिन
              </h4>
              <p className="text-xs text-gray-200 mt-2 leading-relaxed">
                दररोज सकाळी थेट तुमच्या फोनवर जामखेडच्या ताज्या बातम्या व ई-पेपर मोफत मिळवा.
              </p>
              <Link
                href="/subscribe"
                className="mt-4 block text-center bg-[#25D366] hover:bg-[#1EBE5D] text-white py-2 px-4 rounded-lg font-bold text-xs shadow transition-colors"
              >
                मोफत सदस्य व्हा
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}

