import React from "react";
import prisma, { isDatabaseAvailable } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { isSuperAdmin } from "@/lib/rbac";
import { updateSiteSettingsAction } from "@/actions/admin.actions";
import { Settings, Save, Sparkles, TrendingUp, Megaphone, Database } from "lucide-react";

export default async function AdminSettingsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || !isSuperAdmin(currentUser.role)) {
    redirect("/admin");
  }

  const dbReady = await isDatabaseAvailable();
  let settingsList: any[] = [];

  if (dbReady) {
    try {
      settingsList = await prisma.siteSetting.findMany({
        orderBy: { key: "asc" },
      });
    } catch (e) {
      console.error("[AdminSettingsPage DB error]", e);
    }
  }

  const settingsMap: Record<string, string> = {};
  settingsList.forEach((s) => {
    settingsMap[s.key] = s.value;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black font-headline text-gray-950 flex items-center gap-2">
            <Settings className="w-6 h-6 text-red-700" />
            <span>वेबसाइट व न्यूजरूम सेटिंग्ज (System Settings)</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            AI मॉडेल, ट्रेंडिंग अल्गोरिदम वेटेज व गुगल ॲडसेन्स कॉन्फिगरेशन.
          </p>
        </div>
      </div>

      {!dbReady && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3 text-xs text-amber-900 dark:text-amber-300">
          <Database className="w-5 h-5 flex-shrink-0 text-amber-600" />
          <div>
            <span className="font-bold">डेटाबेस सध्या उपलब्ध नाही (Database Unconfigured):</span>{" "}
            सेटिंग्ज सेव्ह करण्यासाठी किंवा अद्ययावत करण्यासाठी प्रॉडक्शन PostgreSQL DATABASE_URL आवश्यक आहे.
          </div>
        </div>
      )}

      <form action={updateSiteSettingsAction} className="space-y-6 text-xs sm:text-sm">
        {/* General Site Branding */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100">
            पोर्टल नाव व माहिती
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-700 mb-1">पोर्टल नाव (इंग्रजी):</label>
              <input
                type="text"
                name="site_name"
                defaultValue={settingsMap["site_name"] || "Awaaz Jamkhedcha"}
                className="w-full border border-gray-300 rounded p-2 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">अधिकृत ब्रीदवाक्य:</label>
              <input
                type="text"
                name="site_tagline"
                defaultValue={settingsMap["site_tagline"] || "जामखेड आणि पंचक्रोशीचा बुलंद आवाज"}
                className="w-full border border-gray-300 rounded p-2 text-xs"
              />
            </div>
          </div>
        </div>

        {/* AI Gateway & Multi-Provider Banner */}
        <div className="bg-gradient-to-r from-purple-900 to-indigo-950 text-white p-6 rounded-2xl shadow-sm border border-purple-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-yellow-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>मल्टी-प्रोव्हायडर AI गेटवे (Multi-Provider AI Gateway)</span>
            </div>
            <h3 className="text-lg font-black font-headline text-white">
              Google Gemini, OpenAI आणि इतर प्रगत मॉडेल्स
            </h3>
            <p className="text-xs text-purple-200 mt-1 max-w-xl">
              नवीन AI Provider व्यवस्थापनाद्वारे आपण OpenAI (GPT-4o), Google Gemini, आणि Groq/DeepSeek सारख्या OpenAI-सुसंगत सेवा सुरक्षित AES-256-GCM एन्क्रिप्शनसह जोडू शकता.
            </p>
          </div>

          <Link
            href="/admin/settings/ai"
            className="flex items-center gap-2 bg-white hover:bg-gray-100 text-purple-950 font-black px-5 py-2.5 rounded-xl text-xs transition-colors shadow whitespace-nowrap"
          >
            <span>AI प्रोव्हायडर्स व्यवस्थापित करा &rarr;</span>
          </Link>
        </div>

        {/* AI Studio Configuration */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-purple-900 font-bold">
            <Sparkles className="w-4 h-4 text-purple-700" />
            <span>डिफॉल्ट Gemini मॉडेल आयडी (Legacy Model Setting)</span>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              उत्पादन AI मॉडेल आयडी (Production Gemini Model ID):
            </label>
            <input
              type="text"
              name="gemini_model"
              defaultValue={settingsMap["gemini_model"] || "gemini-3.6-flash"}
              className="w-full border border-gray-300 rounded p-2 text-xs font-mono font-bold"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              टीप: अधिक प्रगत नियंत्रणासाठी व OpenAI जोडण्यासाठी वरील <strong>AI प्रोव्हायडर्स व्यवस्थापित करा</strong> पेज वापरा.
            </p>
          </div>
        </div>

        {/* Trending Ranking Weights */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-red-900 font-bold">
            <TrendingUp className="w-4 h-4 text-red-700" />
            <span>ट्रेंडिंग अल्गोरिदम वेटेज (Trending Ranking Formula)</span>
          </div>

          <p className="text-xs text-gray-600">
            फॉर्म्युला: <code>Score = (वाचक संख्या × W1) + (शेअर्स × W2) + (ताजेपणा × W3)</code>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                वाचक संख्या वेटेज (Views Weight W1):
              </label>
              <input
                type="number"
                step="0.1"
                name="trending_weight_views_24h"
                defaultValue={settingsMap["trending_weight_views_24h"] || "0.5"}
                className="w-full border border-gray-300 rounded p-2 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                शेअर्स वेटेज (Shares Weight W2):
              </label>
              <input
                type="number"
                step="0.1"
                name="trending_weight_shares"
                defaultValue={settingsMap["trending_weight_shares"] || "1.5"}
                className="w-full border border-gray-300 rounded p-2 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                ताजेपणा वेटेज (Recency Weight W3):
              </label>
              <input
                type="number"
                step="0.1"
                name="trending_weight_recency"
                defaultValue={settingsMap["trending_weight_recency"] || "0.3"}
                className="w-full border border-gray-300 rounded p-2 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Google AdSense Configuration */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-blue-900 font-bold">
            <Megaphone className="w-4 h-4 text-blue-700" />
            <span>गूगल ॲडसेन्स (Google AdSense Settings)</span>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              AdSense पब्लिशर आयडी (Publisher Client ID):
            </label>
            <input
              type="text"
              name="adsense_client_id"
              defaultValue={settingsMap["adsense_client_id"] || "ca-pub-9876543210987654"}
              className="w-full border border-gray-300 rounded p-2 text-xs font-mono"
            />
          </div>
        </div>

        {/* Save Settings Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 bg-red-800 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl transition-colors shadow text-xs"
          >
            <Save className="w-4 h-4" />
            <span>सर्व सेटिंग्ज जतन करा (Save All Settings)</span>
          </button>
        </div>
      </form>
    </div>
  );
}

