import React from "react";
import prisma, { isDatabaseAvailable } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createArticleAction } from "@/actions/article.actions";
import Link from "next/link";
import { Sparkles, ArrowLeft, Save, Send, FileEdit, Globe, Layers } from "lucide-react";
import FeaturedImageUploader from "@/components/admin/FeaturedImageUploader";
import { isEditor } from "@/lib/rbac";

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
        prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
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

  // Fallback defaults if tables are empty
  if (categories.length === 0) {
    categories = [
      { id: "cat-jamkhed", name: "Jamkhed", nameMarathi: "जामखेड विशेष" },
      { id: "cat-politics", name: "Politics", nameMarathi: "राजकारण" },
      { id: "cat-agriculture", name: "Agriculture", nameMarathi: "शेती व हवामान" },
      { id: "cat-crime", name: "Crime", nameMarathi: "गुन्हेगारी" },
      { id: "cat-sports", name: "Sports", nameMarathi: "क्रीडा" },
    ];
  }

  // Prepopulate values: database draft takes precedence over URL query parameters
  const initialHeadline = existingDraft?.headline || resolvedParams.headline || "";
  const initialSubheadline = existingDraft?.subheadline || resolvedParams.subheadline || "";
  const initialSummary = existingDraft?.summary || resolvedParams.summary || "";
  const initialBody = existingDraft?.bodyMarkdown || "";
  const initialCategoryId = existingDraft?.categoryId || categories[0]?.id || "";
  const initialLocationId = existingDraft?.locationId || "";
  const initialFeaturedImage = existingDraft?.featuredImage || "";
  const initialYoutubeUrl = existingDraft?.youtubeUrl || "";
  const initialSlug = existingDraft?.slug || "";
  const initialPriority = existingDraft?.priority ?? 1;
  const initialIsBreaking = existingDraft?.isBreaking ?? false;
  const initialSeoTitle = existingDraft?.seoTitle || "";
  const initialSeoDescription = existingDraft?.seoDescription || "";
  const initialReporterId = existingDraft?.reporterId || user.reporterProfileId || "";

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
          <span>AI न्यूज स्टुडिओद्वारे तयार करा</span>
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
            जामखेड न्यूजरूम मार्गदर्शक तत्त्वे व वस्तुस्थिती पडताळणीनुसार माहिती भरा.
          </p>
        </div>

        <form action={createArticleAction} className="space-y-6 text-xs sm:text-sm">
          {existingDraft && (
            <input type="hidden" name="draftId" value={existingDraft.id} />
          )}

          {/* 1. TITLE (Headline) */}
          <div>
            <label className="block font-bold text-gray-900 mb-1">
              मुख्य शीर्षक (Headline / Title) *
            </label>
            <input
              type="text"
              name="headline"
              required
              defaultValue={initialHeadline}
              placeholder="उदा. जामखेड शहराच्या पाणीपुरवठ्यासाठी नवीन जलवाहिनीचे काम सुरू"
              className="w-full text-base font-bold border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-red-700 focus:outline-none"
            />
          </div>

          {/* 2. SLUG */}
          <div>
            <label className="block font-bold text-gray-800 mb-1">
              URL स्लग (Slug)
            </label>
            <input
              type="text"
              name="slug"
              defaultValue={initialSlug}
              placeholder="उदा. jamkhed-water-pipeline-work-starts (रिक्त ठेवल्यास आपोआप जनरेट होईल)"
              className="w-full border border-gray-300 rounded-lg p-2.5 text-xs font-mono text-gray-800 focus:ring-2 focus:ring-red-700 focus:outline-none"
            />
          </div>

          {/* 3. CATEGORY */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-red-700" />
                <span>बातमी विभाग (News Category) *</span>
              </label>
              <span className="text-[11px] text-gray-500">
                डेटाबेस मधील {categories.length} विभाग उपलब्ध
              </span>
            </div>
            <select
              name="categoryId"
              required
              defaultValue={initialCategoryId}
              className="w-full border border-gray-300 rounded-lg p-3 text-xs sm:text-sm font-bold text-gray-900 bg-white focus:ring-2 focus:ring-red-700 focus:outline-none shadow-xs"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameMarathi} ({c.name})
                </option>
              ))}
            </select>
          </div>

          {/* 4. FEATURED IMAGE (Sharp Optimized Image Uploader) */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <FeaturedImageUploader
              initialImageUrl={initialFeaturedImage}
              name="featuredImage"
              label="मुख्य बातमी फोटो / कव्हर इमेज (Featured Image)"
            />
          </div>

          {/* 5. CONTENT: Subheadline, Summary & Body Markdown */}
          <div className="space-y-4">
            <div>
              <label className="block font-bold text-gray-800 mb-1">
                उपशीर्षक / देख (Subheadline / Dek)
              </label>
              <input
                type="text"
                name="subheadline"
                defaultValue={initialSubheadline}
                placeholder="उदा. खर्डा चौक ते बीड नाका दरम्यान पाईपलाईन; पुढील १५ दिवसांत काम पूर्ण"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 focus:ring-2 focus:ring-red-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-800 mb-1">
                बातमीचा महत्त्वाचा सारांश (Summary)
              </label>
              <textarea
                name="summary"
                rows={2}
                defaultValue={initialSummary}
                placeholder="२ ते ३ वाक्यांत महत्त्वाचा निष्कर्ष किंवा बातमीचा गाभा..."
                className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 focus:ring-2 focus:ring-red-700 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-gray-900">
                  सविस्तर बातमी मजकूर (Body Content) *
                </label>
                <span className="text-[11px] text-gray-400">
                  मार्कडाउन (Headings, Bullets, Quotes, Bold) समर्थित
                </span>
              </div>
              <textarea
                name="bodyMarkdown"
                required
                rows={12}
                defaultValue={initialBody}
                placeholder={`### मुख्य बातमी\n\nजामखेड (विशेष प्रतिनिधी): ...\n\n#### महत्त्वाचे मुद्दे:\n- पहिला मुद्दा\n- दुसरा मुद्दा\n\n> "प्रशासनाकडून आवश्यक सर्व मदत दिली जाईल." - तहसीलदार`}
                className="w-full font-mono text-xs sm:text-sm border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-red-700 focus:outline-none leading-relaxed"
              />
            </div>
          </div>

          {/* 6. LOCATION & REPORTER */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-800 mb-1">
                स्थान (Village / Location)
              </label>
              <select
                name="locationId"
                defaultValue={initialLocationId}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-red-700 focus:outline-none"
              >
                <option value="">-- स्थान निवडा --</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.village} ({loc.taluka})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-800 mb-1">
                बातमीदार (Reporter / Author)
              </label>
              <select
                name="reporterId"
                defaultValue={initialReporterId}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-red-700 focus:outline-none"
              >
                <option value="">न्यूज डेस्क (संपादकीय)</option>
                {reporters.map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    {rep.nameMarathi} ({rep.designation})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 7. PRIORITY, BREAKING & VIDEO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-red-50 rounded-xl border border-red-200">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isBreaking"
                  name="isBreaking"
                  value="true"
                  defaultChecked={initialIsBreaking}
                  className="w-4 h-4 accent-red-700"
                />
                <label htmlFor="isBreaking" className="font-black text-red-900 cursor-pointer">
                  🚨 ब्रेकिंग न्यूज म्हणून दाखवा (Breaking News)
                </label>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <label className="font-bold text-gray-800">प्राधान्य (Priority 0-5):</label>
                <input
                  type="number"
                  name="priority"
                  min="0"
                  max="5"
                  defaultValue={initialPriority}
                  className="w-16 border border-gray-300 rounded p-1 text-center font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-800 mb-1 text-xs">
                YouTube व्हिडिओ लिंक (YouTube URL)
              </label>
              <input
                type="url"
                name="youtubeUrl"
                defaultValue={initialYoutubeUrl}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-red-700 focus:outline-none"
              />
            </div>
          </div>

          {/* 8. TAGS / SEO METADATA */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-700">
              SEO व सोशल मेटाडेटा (Tags & SEO)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  SEO Title (मेटा शीर्षक)
                </label>
                <input
                  type="text"
                  name="seoTitle"
                  defaultValue={initialSeoTitle}
                  placeholder="गूगल शोध परिणामांसाठी शीर्षक..."
                  className="w-full border border-gray-300 rounded p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  SEO Keywords (कीवर्ड्स - स्वल्पविरामाने वेगळे करा)
                </label>
                <input
                  type="text"
                  name="seoKeywords"
                  placeholder="उदा. जामखेड, पाणीपुरवठा, जलवाहिनी, बातमी"
                  className="w-full border border-gray-300 rounded p-2 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                SEO Description (मेटा वर्णन)
              </label>
              <input
                type="text"
                name="seoDescription"
                defaultValue={initialSeoDescription}
                placeholder="सर्च इंजिन निकालाखाली दिसणारा मजकूर..."
                className="w-full border border-gray-300 rounded p-2 text-xs"
              />
            </div>
          </div>

          {/* 9. SUBMIT ACTIONS: SAVE DRAFT & PUBLISH */}
          <div className="pt-4 border-t border-gray-200 flex flex-wrap items-center justify-end gap-3">
            <button
              type="submit"
              name="status"
              value="DRAFT"
              className="flex items-center gap-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold px-4 py-2.5 rounded-xl transition-colors text-xs"
            >
              <Save className="w-4 h-4" />
              <span>मसुदा म्हणून सेव्ह करा (Save Draft)</span>
            </button>

            <button
              type="submit"
              name="status"
              value="SUBMITTED"
              className="flex items-center gap-1.5 bg-blue-800 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-xs shadow"
            >
              <Send className="w-4 h-4" />
              <span>संपादकांकडे पाठवा (Submit for Review)</span>
            </button>

            {userIsEditor && (
              <button
                type="submit"
                name="status"
                value="PUBLISHED"
                className="flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white font-bold px-6 py-2.5 rounded-xl transition-colors text-xs shadow"
              >
                <Globe className="w-4 h-4" />
                <span>थेट प्रसिद्ध करा (Publish Directly)</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
