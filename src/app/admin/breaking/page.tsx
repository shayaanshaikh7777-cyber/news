import React from "react";
import prisma, { isDatabaseAvailable } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  createBreakingNewsAction,
  toggleBreakingNewsAction,
  deleteBreakingNewsAction,
} from "@/actions/breaking.actions";
import { AlertCircle, Plus, Trash2, Power, Clock, ExternalLink, Database } from "lucide-react";

export default async function AdminBreakingNewsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const dbReady = await isDatabaseAvailable();
  let breakingList: any[] = [];

  if (dbReady) {
    try {
      breakingList = await prisma.breakingNews.findMany({
        orderBy: { createdAt: "desc" },
      });
    } catch (e) {
      console.error("[AdminBreakingNewsPage DB error]", e);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black font-headline text-gray-950 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-700" />
            <span>ब्रेकिंग न्यूज व्यवस्थापन (Breaking News Desk)</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            पोर्टलवरील लाल पट्टीमध्ये (Ticker) दिसणाऱ्या तातडीच्या बातम्या व्यवस्थापित करा.
          </p>
        </div>
      </div>

      {!dbReady && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3 text-xs text-amber-900 dark:text-amber-300">
          <Database className="w-5 h-5 flex-shrink-0 text-amber-600" />
          <div>
            <span className="font-bold">डेटाबेस सध्या उपलब्ध नाही (Database Unconfigured):</span>{" "}
            ब्रेकिंग न्यूज अद्ययावत करण्यासाठी प्रॉडक्शन PostgreSQL DATABASE_URL आवश्यक आहे.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Create Breaking News Form (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-base font-black font-headline text-gray-950 mb-4 pb-2 border-b border-gray-100">
            नवीन ब्रेकिंग न्यूज जोडा
          </h2>

          <form action={createBreakingNewsAction} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-bold text-gray-800 mb-1">
                ब्रेकिंग बातमी शीर्षक (Title) *
              </label>
              <textarea
                name="title"
                required
                rows={3}
                placeholder="उदा. जामखेड-कर्जत मार्गावर एसटी बसचा किरकोळ अपघात; वाहतूक पूर्ववत सुरू..."
                className="w-full border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900 focus:ring-2 focus:ring-red-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-800 mb-1">
                सविस्तर बातमी लिंक (Article URL):
              </label>
              <input
                type="text"
                name="linkUrl"
                placeholder="/news/article-slug किंवा https://..."
                className="w-full border border-gray-300 rounded-lg p-2 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-gray-800 mb-1">प्राधान्य (Priority):</label>
                <select
                  name="priority"
                  defaultValue="2"
                  className="w-full border border-gray-300 rounded p-2 text-xs"
                >
                  <option value="1">सामान्य (1)</option>
                  <option value="2">महत्त्वाचे (2)</option>
                  <option value="3">अति-तातडीचे (3)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">कालावधी (Expiration):</label>
                <select
                  name="expiresHours"
                  defaultValue="24"
                  className="w-full border border-gray-300 rounded p-2 text-xs"
                >
                  <option value="4">४ तास</option>
                  <option value="12">१२ तास</option>
                  <option value="24">२४ तास (१ दिवस)</option>
                  <option value="48">४८ तास (२ दिवस)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-red-800 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl transition-colors shadow text-xs flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>तात्काळ प्रसिद्ध करा (Publish Breaking)</span>
            </button>
          </form>
        </div>

        {/* Existing Breaking News List (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-base font-black font-headline text-gray-950 mb-4 pb-2 border-b border-gray-100">
            सक्रिय व मागील ब्रेकिंग नोंदी ({breakingList.length})
          </h2>

          <div className="space-y-3">
            {breakingList.map((item) => {
              const isExpired = item.expiresAt ? new Date(item.expiresAt) < new Date() : false;

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-colors flex items-start justify-between gap-3 ${
                    item.isActive && !isExpired
                      ? "bg-red-50/70 border-red-200 text-gray-900"
                      : "bg-gray-50 border-gray-200 text-gray-500 opacity-80"
                  }`}
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                          item.isActive && !isExpired
                            ? "bg-red-600 text-white animate-pulse"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {item.isActive && !isExpired ? "सक्रिय (Live)" : "बंद"}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        प्राधान्य: {item.priority}
                      </span>
                    </div>

                    <p className="text-xs font-bold leading-snug">{item.title}</p>

                    {item.linkUrl && (
                      <a
                        href={item.linkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-red-700 hover:underline flex items-center gap-1"
                      >
                        <span>लिंक तपासा</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <form
                      action={async () => {
                        "use server";
                        await toggleBreakingNewsAction(item.id, !item.isActive);
                      }}
                    >
                      <button
                        type="submit"
                        className={`p-1.5 rounded transition-colors ${
                          item.isActive
                            ? "bg-amber-100 hover:bg-amber-200 text-amber-900"
                            : "bg-green-100 hover:bg-green-200 text-green-900"
                        }`}
                        title={item.isActive ? "बंद करा" : "सुरू करा"}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </form>

                    <form
                      action={async () => {
                        "use server";
                        await deleteBreakingNewsAction(item.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="p-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded transition-colors"
                        title="हटवा"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
