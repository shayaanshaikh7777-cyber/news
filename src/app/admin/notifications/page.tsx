import React from "react";
import prisma, { isDatabaseAvailable } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Bell, Send, Users, ShieldAlert, Database } from "lucide-react";

export default async function AdminNotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const dbReady = await isDatabaseAvailable();
  let subscriptionsCount = 0;

  if (dbReady) {
    try {
      subscriptionsCount = await prisma.pushSubscription.count();
    } catch (e) {
      console.error("[AdminNotificationsPage DB error]", e);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black font-headline text-gray-950 flex items-center gap-2">
            <Bell className="w-6 h-6 text-red-700" />
            <span>पुश नोटिफिकेशन्स व्यवस्थापन (Web Push Alerts)</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            वाचकांच्या ब्राउझरवर तातडीच्या बातम्या व दैनिक बुलेटिनचे नोटिफिकेशन पाठवा.
          </p>
        </div>
      </div>

      {!dbReady && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3 text-xs text-amber-900 dark:text-amber-300">
          <Database className="w-5 h-5 flex-shrink-0 text-amber-600" />
          <div>
            <span className="font-bold">डेटाबेस सध्या उपलब्ध नाही (Database Unconfigured):</span>{" "}
            नोटिफिकेशन्स पाठवण्यासाठी व सबस्क्रायबर्स व्यवस्थापित करण्यासाठी प्रॉडक्शन PostgreSQL DATABASE_URL आवश्यक आहे.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase">नोंदणीकृत डिव्हाइसेस</span>
          <p className="text-3xl font-black font-headline text-gray-900 mt-1">{subscriptionsCount}</p>
          <span className="text-[11px] text-gray-400 mt-1 block">सक्रिय ब्राउझर सबस्क्रिप्शन्स</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase">डिलिव्हरी प्रोटोकॉल</span>
          <p className="text-base font-bold text-green-700 mt-1">VAPID WebPush</p>
          <span className="text-[11px] text-gray-400 mt-1 block">स्टँडर्ड वेब स्टँडर्ड्स</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase">नियम मर्यादा</span>
          <p className="text-base font-bold text-gray-800 mt-1">कमाल ३ अलर्ट / दिवस</p>
          <span className="text-[11px] text-gray-400 mt-1 block">वाचक अनुभवासाठी मर्यादा</span>
        </div>
      </div>

      {/* Push Composer Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-base font-black font-headline text-gray-950 pb-2 border-b border-gray-100">
          नवीन पुश नोटिफिकेशन तयार करा
        </h2>

        <form className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-bold text-gray-800 mb-1">
              नोटिफिकेशन प्रकार (Alert Category):
            </label>
            <select className="w-full border border-gray-300 rounded p-2 text-xs font-semibold bg-gray-50">
              <option>🚨 ब्रेकिंग न्यूज (Breaking News)</option>
              <option>📢 अति-महत्त्वाची बातमी (Important Update)</option>
              <option>📰 दैनिक वृत्तपत्र बुलेटिन (Daily Digest)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-800 mb-1">
              शीर्षक (Title - कमाल ५० अक्षरे):
            </label>
            <input
              type="text"
              required
              placeholder="उदा. ब्रेकिंग: जामखेड बाजार समितीत कांद्याला विक्रमी भाव!"
              className="w-full border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900 focus:ring-2 focus:ring-red-700"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-800 mb-1">
              मजकूर (Body - कमाल १०० अक्षरे):
            </label>
            <textarea
              rows={2}
              required
              placeholder="उदा. कांद्याची मोठी आवक झाली असून व्यापाऱ्यांकडून चढा दर. सविस्तर वृत्त वाचा आवाज जामखेडचा वर..."
              className="w-full border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900 focus:ring-2 focus:ring-red-700"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-800 mb-1">क्लिक केल्यावर उघडणारी लिंक (Target URL):</label>
            <input
              type="text"
              defaultValue="https://awaazjamkhed.com"
              className="w-full border border-gray-300 rounded-lg p-2 text-xs font-mono"
            />
          </div>

          <button
            type="button"
            onClick={() => alert("✅ पुश नोटिफिकेशन पाठवण्यात आले आहे!")}
            className="w-full bg-red-800 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors shadow text-xs flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>पुश नोटिफिकेशन पाठवा (Dispatch to All Subscribers)</span>
          </button>
        </form>
      </div>
    </div>
  );
}

