import React from "react";
import prisma, { isDatabaseAvailable } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DollarSign, TrendingUp, MousePointerClick, Calendar, Award, Database } from "lucide-react";

export default async function AdminRevenuePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const dbReady = await isDatabaseAvailable();
  let ads: any[] = [];

  if (dbReady) {
    try {
      ads = await prisma.advertisement.findMany({
        orderBy: { campaignRevenue: "desc" },
      });
    } catch (e) {
      console.error("[AdminRevenuePage DB error]", e);
    }
  }

  const totals = ads.reduce(
    (acc, ad) => {
      acc.directRevenue += ad.campaignRevenue;
      acc.impressions += ad.impressions;
      acc.clicks += ad.clicks;
      return acc;
    },
    { directRevenue: 0, impressions: 0, clicks: 0 }
  );

  // AdSense revenue estimate: ~₹45 per 1,000 pageviews / impressions
  const adSenseRevenue = Math.round((totals.impressions / 1000) * 45);
  const totalGrossRevenue = totals.directRevenue + adSenseRevenue;
  const overallCtr =
    totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : "0.00";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black font-headline text-gray-950 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-700" />
            <span>महसूल व मोनेटायझेशन डॅशबोर्ड (Revenue Dashboard)</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            स्थानिक थेट जाहिरातदार आणि गुगल ॲडसेन्स कमाईचे संपूर्ण विश्लेषण.
          </p>
        </div>
      </div>

      {!dbReady && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3 text-xs text-amber-900 dark:text-amber-300">
          <Database className="w-5 h-5 flex-shrink-0 text-amber-600" />
          <div>
            <span className="font-bold">डेटाबेस सध्या उपलब्ध नाही (Database Unconfigured):</span>{" "}
            महसूल आकडेवारी मोजण्यासाठी प्रॉडक्शन PostgreSQL DATABASE_URL आवश्यक आहे.
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase">एकूण महसूल (Total Gross)</span>
          <p className="text-2xl sm:text-3xl font-black font-headline text-green-700 mt-1">
            ₹{totalGrossRevenue.toLocaleString("en-IN")}
          </p>
          <span className="text-[11px] text-gray-400 mt-1 block">थेट जाहिराती + ॲडसेन्स अंदाज</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase">थेट जाहिरातदार कमाई</span>
          <p className="text-2xl sm:text-3xl font-black font-headline text-gray-900 mt-1">
            ₹{totals.directRevenue.toLocaleString("en-IN")}
          </p>
          <span className="text-[11px] text-gray-400 mt-1 block">{ads.length} मोहीम करार</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase">AdSense अंदाज (CPM ₹45)</span>
          <p className="text-2xl sm:text-3xl font-black font-headline text-gray-900 mt-1">
            ₹{adSenseRevenue.toLocaleString("en-IN")}
          </p>
          <span className="text-[11px] text-gray-400 mt-1 block">नेटवर्क कमाई</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase">सरासरी क्लिक दर (CTR)</span>
          <p className="text-2xl sm:text-3xl font-black font-headline text-purple-700 mt-1">
            {overallCtr}%
          </p>
          <span className="text-[11px] text-gray-400 mt-1 block">{totals.clicks.toLocaleString("en-IN")} एकूण क्लिक्स</span>
        </div>
      </div>

      {/* Campaigns Revenue Breakdown Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-sm font-black font-headline text-gray-900">
            जाहिरात मोहिमांचा महसूल तपशील (Campaigns Breakdown)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">जाहिरातदार (Advertiser)</th>
                <th className="py-3 px-4">प्लेसमेंट</th>
                <th className="py-3 px-4">इम्प्रेशन्स</th>
                <th className="py-3 px-4">क्लिक्स</th>
                <th className="py-3 px-4">CTR</th>
                <th className="py-3 px-4">स्थिती</th>
                <th className="py-3 px-4 text-right">महसूल (Revenue)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ads.map((ad) => {
                const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : "0.00";

                return (
                  <tr key={ad.id} className="hover:bg-gray-50/80">
                    <td className="py-3 px-4 font-bold text-gray-950">{ad.advertiser}</td>
                    <td className="py-3 px-4 font-semibold text-gray-700">{ad.placement}</td>
                    <td className="py-3 px-4 font-mono">{ad.impressions.toLocaleString("en-IN")}</td>
                    <td className="py-3 px-4 font-mono">{ad.clicks.toLocaleString("en-IN")}</td>
                    <td className="py-3 px-4 font-mono font-bold text-purple-700">{ctr}%</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                          ad.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {ad.isActive ? "सक्रिय" : "बंद"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black font-headline text-sm text-green-700">
                      ₹{ad.campaignRevenue.toLocaleString("en-IN")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

