import React from "react";
import prisma, { isDatabaseAvailable } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowLeft, FileEdit } from "lucide-react";
import { isEditor } from "@/lib/rbac";
import NewArticleForm from "@/components/admin/NewArticleForm";
import { getOrSeedCategories } from "@/lib/categories";

interface Props {
  searchParams?: Promise<{
    draftId?: string;
    headline?: string;
    subheadline?: string;
    summary?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function NewArticlePage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const resolvedParams = searchParams ? await searchParams : {};
  const dbUp = await isDatabaseAvailable();

  let categories: any[] = [];
  let locations: any[] = [];
  let reporters: any[] = [];
  let existingDraft: any = null;

  if (dbUp) {
    try {
      const [cats, locs, reps] = await Promise.all([
        getOrSeedCategories(),
        prisma.location.findMany({ orderBy: { village: "asc" } }),
        prisma.reporterProfile.findMany({ orderBy: { nameMarathi: "asc" } }),
      ]);
      categories = cats;
      locations = locs;
      reporters = reps;

      if (resolvedParams.draftId) {
        existingDraft = await prisma.article.findUnique({
          where: { id: resolvedParams.draftId },
        });
      }
    } catch (e) {
      console.error("[NewArticlePage DB query error]", e);
    }
  }

  // Prepopulate values: database draft takes precedence over URL query parameters
  const initialData = {
    headline: existingDraft?.headline || resolvedParams.headline || "",
    subheadline: existingDraft?.subheadline || resolvedParams.subheadline || "",
    summary: existingDraft?.summary || resolvedParams.summary || "",
    bodyMarkdown: existingDraft?.bodyMarkdown || "",
    categoryId: existingDraft?.categoryId || categories[0]?.id || "",
    locationId: existingDraft?.locationId || "",
    featuredImage: existingDraft?.featuredImage || "",
    youtubeUrl: existingDraft?.youtubeUrl || "",
    slug: existingDraft?.slug || "",
    priority: existingDraft?.priority ?? 1,
    isBreaking: existingDraft?.isBreaking ?? false,
    seoTitle: existingDraft?.seoTitle || "",
    seoDescription: existingDraft?.seoDescription || "",
    seoKeywords: existingDraft?.seoKeywords || "",
    reporterId: existingDraft?.reporterId || user.reporterProfileId || "",
    draftId: existingDraft?.id,
  };

  const userIsEditor = isEditor(user.role);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/articles"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-red-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>सर्व बातम्यांकडे परत</span>
        </Link>

        <Link
          href="/admin/ai-studio"
          className="inline-flex items-center gap-1.5 bg-purple-700 hover:bg-purple-600 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-sm transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI स्टुडिओ उघडा</span>
        </Link>
      </div>

      {existingDraft && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between text-xs text-purple-900">
          <div className="flex items-center gap-2">
            <FileEdit className="w-4 h-4 text-purple-700 flex-shrink-0" />
            <span className="font-bold">
              AI स्टुडिओमधून सेव्ह केलेला मसुदा लोड केला आहे (Draft ID: {existingDraft.id.slice(0, 8)}...)
            </span>
          </div>
          <span className="bg-purple-200 text-purple-800 font-bold px-2 py-0.5 rounded">
            DRAFT ACTIVE
          </span>
        </div>
      )}

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm">
        <div className="pb-4 border-b border-gray-200 mb-6">
          <h1 className="text-2xl font-black font-headline text-gray-950">
            {existingDraft ? "मसुदा संपादन (Edit Story Draft)" : "नवीन बातमी संकलन (New Story Draft)"}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            जामखेड न्यूजरूम मार्गदर्शक तत्त्वे व वस्तुस्थिती पडताळणीनुसार माहिती भरा किंवा AI बातमी सहाय्यकाचा वापर करा.
          </p>
        </div>

        <NewArticleForm
          categories={categories}
          locations={locations}
          reporters={reporters}
          initialData={initialData}
          userIsEditor={userIsEditor}
        />
      </div>
    </div>
  );
}
