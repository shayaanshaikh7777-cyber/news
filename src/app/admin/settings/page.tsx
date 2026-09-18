import React from "react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/rbac";
import { updateSiteSettingsAction } from "@/actions/admin.actions";
import { Settings, Save, Sparkles, TrendingUp, Megaphone } from "lucide-react";

export default async function AdminSettingsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || !isSuperAdmin(currentUser.role)) {
    redirect("/admin");
  }

  const settingsList = await prisma.siteSetting.findMany({
    orderBy: { key: "asc" },
  });

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

        {/* AI Studio Configuration */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-purple-900 font-bold">
            <Sparkles className="w-4 h-4 text-purple-700" />
            <span>Google Gemini AI मॉडेल कॉन्फिगरेशन (Configurable AI Model)</span>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              उत्पादन AI मॉडेल आयडी (Production Gemini Model ID):
            </label>
            <input
              type="text"
              name="gemini_model"
              defaultValue={settingsMap["gemini_model"] || "gemini-3.8-flash"}
              className="w-full border border-gray-300 rounded p-2 text-xs font-mono font-bold"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              अ‍ॅप्लिकेशन कोड बदलल्याशिवाय येथे मॉडेल अपग्रेड करता येते (उदा. `gemini-3.8-flash`, `gemini-3.5-flash-lite`, इ.).
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
