import React from "react";
import prisma, { isDatabaseAvailable } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createAdAction, toggleAdAction, deleteAdAction } from "@/actions/ad.actions";
import { Megaphone, Plus, Trash2, Power, TrendingUp, MousePointer, Database } from "lucide-react";

export default async function AdminAdsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const dbReady = await isDatabaseAvailable();
  let ads: any[] = [];

  if (dbReady) {
    try {
      ads = await prisma.advertisement.findMany({
        orderBy: { createdAt: "desc" },
      });
    } catch (e) {
      console.error("[AdminAdsPage DB error]", e);
    }
  }

  const placements = [
    { key: "HEADER", label: "हेडर बॅनर (HEADER)" },
    { key: "TOP_BANNER", label: "टॉप बॅनर (TOP_BANNER)" },
    { key: "SIDEBAR", label: "साइडबार (SIDEBAR)" },
    { key: "ARTICLE_MIDDLE", label: "बातमीच्या मध्यभागी (ARTICLE_MIDDLE)" },
    { key: "ARTICLE_BOTTOM", label: "बातमीच्या खाली (ARTICLE_BOTTOM)" },
    { key: "FOOTER", label: "फूटर बॅनर (FOOTER)" },
    { key: "MOBILE_STICKY", label: "मोबाईल स्टिकी (MOBILE_STICKY)" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black font-headline text-gray-950 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-red-700" />
            <span>जाहिरात व्यवस्थापन (Ad Engine Management)</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            स्थानिक जाहिरातदार, बॅनर मोहिमा, वेटेज रोटेशन व क्लिक/इम्प्रेशन ट्रॅकिंग.
          </p>
        </div>
      </div>

      {!dbReady && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3 text-xs text-amber-900 dark:text-amber-300">
          <Database className="w-5 h-5 flex-shrink-0 text-amber-600" />
          <div>
            <span className="font-bold">डेटाबेस सध्या उपलब्ध नाही (Database Unconfigured):</span>{" "}
            जाहिराती व्यवस्थापित करण्यासाठी प्रॉडक्शन PostgreSQL DATABASE_URL आवश्यक आहे.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Create Ad Form (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-base font-black font-headline text-gray-950 mb-4 pb-2 border-b border-gray-100">
            नवीन जाहिरात मोहीम जोडा
          </h2>

          <form action={createAdAction} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-bold text-gray-800 mb-1">
                जाहिरातदाराचे नाव (Advertiser Name) *
              </label>
              <input
                type="text"
                name="advertiser"
                required
                placeholder="उदा. महालक्ष्मी सराफ आणि ज्वेलर्स, जामखेड"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900 focus:ring-2 focus:ring-red-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-800 mb-1">
                बॅनर इमेज URL (Banner Image URL) *
              </label>
              <input
                type="url"
                name="bannerUrl"
                required
                placeholder="https://images.unsplash.com/..."
                className="w-full border border-gray-300 rounded-lg p-2 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-800 mb-1">
                क्लिक टार्गेट लिंक (Destination URL) *
              </label>
              <input
                type="url"
                name="destinationUrl"
                required
                placeholder="https://example.com/offer"
                className="w-full border border-gray-300 rounded-lg p-2 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-gray-800 mb-1">प्लेसमेंट (Placement):</label>
                <select
                  name="placement"
                  defaultValue="HEADER"
                  className="w-full border border-gray-300 rounded p-2 text-xs"
                >
                  {placements.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">वेटेज (Weight 1-10):</label>
                <input
                  type="number"
                  name="weight"
                  min="1"
                  max="10"
                  defaultValue="1"
                  className="w-full border border-gray-300 rounded p-2 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-800 mb-1">
                मोहीम शुल्क / महसूल (Revenue in ₹):
              </label>
              <input
                type="number"
                name="campaignRevenue"
                defaultValue="5000"
                className="w-full border border-gray-300 rounded p-2 text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-red-800 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl transition-colors shadow text-xs flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>जाहिरात मोहीम सुरू करा</span>
            </button>
          </form>
        </div>

        {/* Existing Ads List (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-base font-black font-headline text-gray-950 mb-4 pb-2 border-b border-gray-100">
            सक्रिय जाहिराती ({ads.length})
          </h2>

          <div className="space-y-3 text-xs">
            {ads.map((ad) => {
              const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : "0.00";

              return (
                <div
                  key={ad.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                    ad.isActive ? "bg-white border-gray-200" : "bg-gray-50 border-gray-200 opacity-60"
                  }`}
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="bg-red-100 text-red-900 font-extrabold text-[10px] px-2 py-0.5 rounded uppercase">
                        {ad.placement}
                      </span>
                      <span className="text-gray-400 text-[11px]">वेटेज: {ad.weight}</span>
                      <span className="text-green-700 font-bold text-[11px]">
                        ₹{ad.campaignRevenue.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <h3 className="font-bold text-gray-900 text-sm truncate">{ad.advertiser}</h3>

                    <div className="flex items-center gap-4 text-gray-500 text-[11px] pt-1">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-cyan-600" />
                        {ad.impressions.toLocaleString("en-IN")} इम्प्रेशन्स
                      </span>
                      <span className="flex items-center gap-1">
                        <MousePointer className="w-3 h-3 text-green-600" />
                        {ad.clicks.toLocaleString("en-IN")} क्लिक्स
                      </span>
                      <span className="font-bold text-gray-700">CTR: {ctr}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <form
                      action={async () => {
                        "use server";
                        await toggleAdAction(ad.id, !ad.isActive);
                      }}
                    >
                      <button
                        type="submit"
                        className={`p-1.5 rounded transition-colors ${
                          ad.isActive
                            ? "bg-green-100 hover:bg-green-200 text-green-800"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                        }`}
                        title={ad.isActive ? "सक्रिय (क्लिक करून बंद करा)" : "बंद"}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </form>

                    <form
                      action={async () => {
                        "use server";
                        await deleteAdAction(ad.id);
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
