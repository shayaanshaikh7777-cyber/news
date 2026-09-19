import React from "react";
import prisma, { isDatabaseAvailable } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import {
  updateArticleAction,
  changeWorkflowStatusAction,
  addLiveUpdateAction,
} from "@/actions/article.actions";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Radio,
  History,
  Send,
  Save,
  Globe,
  Newspaper,
  AlertTriangle,
  Database,
  Layers,
} from "lucide-react";
import FeaturedImageUploader from "@/components/admin/FeaturedImageUploader";
import { canEditArticle, isEditor, isSuperAdmin } from "@/lib/rbac";
import { ALLOWED_TRANSITIONS, ArticleStatus } from "@/lib/workflow";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditArticlePage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  if (!(await isDatabaseAvailable())) {
    return (
      <div className="max-w-4xl mx-auto p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4">
        <Database className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">डेटाबेस उपलब्ध नाही (Database Offline)</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          बातमी संपादन करण्यासाठी किंवा पाहण्यासाठी प्रॉडक्शन PostgreSQL डेटाबेसशी संपर्क आवश्यक आहे.
        </p>
        <Link href="/admin/articles" className="inline-flex items-center gap-2 px-4 py-2 bg-red-800 text-white rounded-xl text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> बातम्यांच्या यादीकडे परत
        </Link>
      </div>
    );
  }

  const { id } = await params;

  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      category: true,
      location: true,
      reporter: true,
      createdBy: true,
      approvedBy: true,
      publishedBy: true,
      liveUpdates: { orderBy: { timestamp: "desc" } },
      revisions: {
        include: { changedBy: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!article) notFound();

  const [categories, locations, reporters] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.location.findMany({ orderBy: { village: "asc" } }),
    prisma.reporterProfile.findMany({ orderBy: { nameMarathi: "asc" } }),
  ]);

  const allowedNext = ALLOWED_TRANSITIONS[article.status as ArticleStatus] || [];
  const canEdit = canEditArticle(user, article);
  const userIsEditor = isEditor(user.role);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/articles"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-red-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>सर्व बातम्यांकडे परत</span>
        </Link>

        <div className="flex items-center gap-2">
          {article.status === "PUBLISHED" && (
            <Link
              href={`/news/${article.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1 bg-green-700 hover:bg-green-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>पोर्टलवर पाहा</span>
            </Link>
          )}

          <a
            href={`/api/clippings/generate?articleSlug=${article.slug}&format=EPAPER`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-bold px-3 py-1.5 rounded-lg text-xs"
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>कात्रण बनवा</span>
          </a>
        </div>
      </div>

      {/* Editorial Workflow State Machine Box */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              वर्तमान न्यूजरूम स्थिती (Current Workflow Stage)
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-black font-headline text-gray-950">
                {article.status}
              </span>
              <span className="text-xs bg-red-100 text-red-900 font-bold px-2 py-0.5 rounded">
                आवृत्ती संख्या: {article.revisions.length}
              </span>
            </div>
          </div>

          {/* Workflow Transition Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {allowedNext.map((targetStatus) => {
              const formAction = async () => {
                "use server";
                await changeWorkflowStatusAction({
                  articleId: article.id,
                  targetStatus: targetStatus as ArticleStatus,
                  changeSummary: `${user.name} यांनी स्थिती '${article.status}' वरून '${targetStatus}' मध्ये बदलली.`,
                });
              };

              let btnClass = "bg-gray-800 text-white hover:bg-gray-700";
              if (targetStatus === "PUBLISHED" || targetStatus === "APPROVED") {
                btnClass = "bg-green-700 text-white hover:bg-green-600";
              } else if (targetStatus === "REJECTED") {
                btnClass = "bg-red-700 text-white hover:bg-red-600";
              } else if (targetStatus === "REVISION_REQUESTED") {
                btnClass = "bg-orange-700 text-white hover:bg-orange-600";
              } else if (targetStatus === "UNDER_REVIEW") {
                btnClass = "bg-blue-700 text-white hover:bg-blue-600";
              }

              return (
                <form key={targetStatus} action={formAction}>
                  <button
                    type="submit"
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${btnClass}`}
                  >
                    &rarr; {targetStatus}
                  </button>
                </form>
              );
            })}
          </div>
        </div>

        {/* Workflow Attribution Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-[11px] text-gray-500">
          <div>
            <span className="block font-bold text-gray-700">लेखक / बातमीदार:</span>
            <span>{article.reporter?.nameMarathi || article.createdBy?.name || "—"}</span>
          </div>
          <div>
            <span className="block font-bold text-gray-700">मंजूर करणारे संपादक:</span>
            <span>{article.approvedBy?.name || "प्रलंबित"}</span>
          </div>
          <div>
            <span className="block font-bold text-gray-700">प्रसिद्ध करणारे:</span>
            <span>{article.publishedBy?.name || "—"}</span>
          </div>
          <div>
            <span className="block font-bold text-gray-700">प्रसिद्ध दिनांक:</span>
            <span>
              {article.publishedAt
                ? new Intl.DateTimeFormat("mr-IN", { dateStyle: "short", timeStyle: "short" }).format(
                    new Date(article.publishedAt)
                  )
                : "अद्याप नाही"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Editor Form (8 cols) */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm">
          <form
            action={updateArticleAction.bind(null, article.id)}
            className="space-y-6 text-xs sm:text-sm"
          >
            {/* 1. TITLE */}
            <div>
              <label className="block font-bold text-gray-900 mb-1">
                मुख्य शीर्षक (Headline / Title) *
              </label>
              <input
                type="text"
                name="headline"
                required
                defaultValue={article.headline}
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
                defaultValue={article.slug}
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
                defaultValue={article.categoryId}
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
                initialImageUrl={article.featuredImage}
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
                  defaultValue={article.subheadline || ""}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 focus:ring-2 focus:ring-red-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">
                  बातमीचा सारांश (Summary)
                </label>
                <textarea
                  name="summary"
                  rows={2}
                  defaultValue={article.summary || ""}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 focus:ring-2 focus:ring-red-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-900 mb-1">
                  सविस्तर बातमी मजकूर (Body Markdown) *
                </label>
                <textarea
                  name="bodyMarkdown"
                  required
                  rows={12}
                  defaultValue={article.bodyMarkdown}
                  className="w-full font-mono text-xs sm:text-sm border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-red-700 focus:outline-none leading-relaxed"
                />
              </div>
            </div>

            {/* 6. LOCATION & REPORTER */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-800 mb-1">स्थान (Village / Location)</label>
                <select
                  name="locationId"
                  defaultValue={article.locationId || ""}
                  className="w-full border border-gray-300 rounded p-2 text-xs"
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
                <label className="block font-bold text-gray-800 mb-1">बातमीदार (Reporter / Author)</label>
                <select
                  name="reporterId"
                  defaultValue={article.reporterId || ""}
                  className="w-full border border-gray-300 rounded p-2 text-xs"
                >
                  <option value="">न्यूज डेस्क (संपादकीय)</option>
                  {reporters.map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.nameMarathi}
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
                    defaultChecked={article.isBreaking}
                    value="true"
                    className="w-4 h-4 accent-red-700"
                  />
                  <label htmlFor="isBreaking" className="font-bold text-red-900 cursor-pointer">
                    🚨 ब्रेकिंग न्यूज (Breaking)
                  </label>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <label className="font-bold text-gray-800">प्राधान्य (0-5):</label>
                  <input
                    type="number"
                    name="priority"
                    defaultValue={article.priority}
                    min="0"
                    max="5"
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
                  defaultValue={article.youtubeUrl || ""}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-red-700 focus:outline-none"
                />
              </div>
            </div>

            {/* 8. TAGS / SEO */}
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
                    defaultValue={article.seoTitle || ""}
                    placeholder="गूगल शोध परिणामांसाठी शीर्षक..."
                    className="w-full border border-gray-300 rounded p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    SEO Keywords (कीवर्ड्स)
                  </label>
                  <input
                    type="text"
                    name="seoKeywords"
                    defaultValue={article.seoKeywords || ""}
                    placeholder="उदा. जामखेड, राजकारण, पाणीपुरवठा"
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
                  defaultValue={article.seoDescription || ""}
                  placeholder="सर्च इंजिन निकालाखाली दिसणारा मजकूर..."
                  className="w-full border border-gray-300 rounded p-2 text-xs"
                />
              </div>
            </div>

            {/* 9. SUBMIT ACTIONS */}
            <div className="pt-4 border-t border-gray-200 flex flex-wrap items-center justify-end gap-3">
              <button
                type="submit"
                disabled={!canEdit}
                className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-white font-bold px-6 py-2.5 rounded-xl transition-colors shadow text-xs"
              >
                <Save className="w-4 h-4" />
                <span>बदल जतन करा (Save Changes)</span>
              </button>

              {userIsEditor && article.status !== "PUBLISHED" && (
                <button
                  type="submit"
                  name="status"
                  value="PUBLISHED"
                  disabled={!canEdit}
                  className="flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white font-bold px-6 py-2.5 rounded-xl transition-colors shadow text-xs"
                >
                  <Globe className="w-4 h-4" />
                  <span>थेट प्रसिद्ध करा (Publish Directly)</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Sidebar: Live Updates & Version History (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Live Updates Box */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-200 mb-3 text-red-900 font-bold text-sm">
              <Radio className="w-4 h-4 text-red-700" />
              <span>लाईव्ह अपडेट जोडा (Add Live Update)</span>
            </div>

            <form action={addLiveUpdateAction} className="space-y-3 text-xs">
              <input type="hidden" name="articleId" value={article.id} />
              <input type="hidden" name="authorName" value={user.name} />
              <div>
                <textarea
                  name="content"
                  required
                  rows={3}
                  placeholder="उदा. ७:४२ PM — पोलिसांनी घटनास्थळी पंचनामा पूर्ण केला..."
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-red-700 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={!userIsEditor}
                className="w-full bg-red-800 hover:bg-red-700 text-white font-bold py-2 rounded-lg text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>लाईव्ह अपडेट प्रसिद्ध करा</span>
              </button>
            </form>

            {/* Existing Live Updates */}
            {article.liveUpdates.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <span className="text-[11px] font-bold text-gray-500 block">
                  या बातमीतील लाईव्ह नोंदी ({article.liveUpdates.length}):
                </span>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {article.liveUpdates.map((lu) => (
                    <div key={lu.id} className="p-2.5 bg-gray-50 rounded border border-gray-100 text-xs">
                      <div className="flex items-center justify-between text-[10px] text-gray-400 font-semibold mb-1">
                        <span>{lu.authorName}</span>
                        <span>
                          {new Intl.DateTimeFormat("mr-IN", { timeStyle: "short" }).format(
                            new Date(lu.timestamp)
                          )}
                        </span>
                      </div>
                      <p className="text-gray-800 font-medium">{lu.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Article Version History (Audit Trail) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-200 mb-3 text-gray-900 font-bold text-sm">
              <History className="w-4 h-4 text-gray-700" />
              <span>आवृत्ती इतिहास (Version History)</span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {article.revisions.map((rev) => (
                <div key={rev.id} className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 text-xs">
                  <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                    <span className="font-bold text-gray-700">{rev.changedBy.name}</span>
                    <span>
                      {new Intl.DateTimeFormat("mr-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                      }).format(new Date(rev.createdAt))}
                    </span>
                  </div>
                  <p className="text-gray-800 font-medium">{rev.changeSummary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
