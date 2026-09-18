import React from "react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MessageSquare, Send, Users, ShieldCheck, CheckCircle2, Phone } from "lucide-react";

export default async function AdminWhatsAppPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const subscribers = await prisma.whatsAppSubscriber.findMany({
    orderBy: { createdAt: "desc" },
  });

  const activeCount = subscribers.filter((s) => s.status === "ACTIVE").length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black font-headline text-gray-950 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-green-600" />
            <span>व्हॉट्सॲप सदस्य व ब्रॉडकास्ट (WhatsApp Subscribers)</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            अधिकृत WhatsApp Business Cloud API संमती-आधारित (Opt-In) बातमीपत्र व्यवस्थापन.
          </p>
        </div>

        <div className="bg-green-100 text-green-900 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-green-700" />
          <span>१००% Opt-In संमती आधारित</span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase">सक्रिय सदस्य (Active Subscribers)</span>
          <p className="text-2xl sm:text-3xl font-black font-headline text-green-700 mt-1">
            {activeCount}
          </p>
          <span className="text-[11px] text-gray-400 mt-1 block">दैनिक बुलेटिन प्राप्तकर्ते</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase">एकूण नोंदणी (Total Registrations)</span>
          <p className="text-2xl sm:text-3xl font-black font-headline text-gray-900 mt-1">
            {subscribers.length}
          </p>
          <span className="text-[11px] text-gray-400 mt-1 block">जामखेड व परिसर वाचक</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase">API स्थिती (Meta Cloud API)</span>
          <p className="text-lg font-black text-gray-900 mt-1 flex items-center gap-1.5 text-blue-700">
            <span>●</span>
            <span>तयार / सज्ज (Ready)</span>
          </p>
          <span className="text-[11px] text-gray-400 mt-1 block">अधिकृत टेम्पलेट्स कॉन्फिगर</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Broadcast Composer (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-base font-black font-headline text-gray-950 pb-2 border-b border-gray-100 flex items-center gap-2">
            <Send className="w-4 h-4 text-green-600" />
            <span>दैनिक बुलेटिन ब्रॉडकास्ट पाठवा</span>
          </h2>

          <div className="p-3 bg-green-50 rounded-xl border border-green-200 text-xs text-green-900 leading-relaxed">
            <p className="font-bold mb-1">अधिकृत टेम्पलेट नियम:</p>
            <p>
              स्पॅम प्रतिबंधासाठी केवळ पूर्वनिर्धारित व मेटा द्वारे मंजूर टेम्पलेट मेसेजेस सक्रिय सदस्यांना पाठवले जातात.
            </p>
          </div>

          <form className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-bold text-gray-800 mb-1">
                टेम्पलेट निवडा (Approved Template):
              </label>
              <select className="w-full border border-gray-300 rounded p-2 text-xs font-semibold bg-gray-50">
                <option>jamkhed_morning_bulletin (सकाळचे बातमीपत्र)</option>
                <option>breaking_news_alert (अति-तातडीची बातमी)</option>
                <option>apmc_market_rates (कृषी बाजारभाव अपडेट)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-800 mb-1">
                आजच्या प्रमुख बातमीचे शीर्षक (Headline):
              </label>
              <input
                type="text"
                placeholder="उदा. जामखेड बाजार समितीत कांद्याला विक्रमी भाव..."
                className="w-full border border-gray-300 rounded p-2 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-800 mb-1">बातमी वेब लिंक:</label>
              <input
                type="text"
                placeholder="https://awaazjamkhed.com/news/..."
                className="w-full border border-gray-300 rounded p-2 text-xs"
              />
            </div>

            <button
              type="button"
              onClick={() => alert("✅ व्हॉट्सॲप ब्रॉडकास्ट टास्क यशस्वीरीत्या क्यूमध्ये पाठवला गेला आहे!")}
              className="w-full bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold py-2.5 rounded-xl transition-colors shadow text-xs flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
              <span>{activeCount} सक्रिय सदस्यांना पाठवा</span>
            </button>
          </form>
        </div>

        {/* Subscribers Directory Table (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-base font-black font-headline text-gray-950 pb-2 border-b border-gray-100 mb-4">
            नोंदणीकृत सदस्य यादी ({subscribers.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-3">नाव</th>
                  <th className="py-2.5 px-3">मोबाईल</th>
                  <th className="py-2.5 px-3">गाव / स्थान</th>
                  <th className="py-2.5 px-3">स्थिती</th>
                  <th className="py-2.5 px-3">नोंदणी तारीख</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subscribers.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50/80">
                    <td className="py-2.5 px-3 font-bold text-gray-900">{sub.name}</td>
                    <td className="py-2.5 px-3 font-mono text-gray-700">{sub.phone}</td>
                    <td className="py-2.5 px-3 text-gray-600">{sub.location || "जामखेड"}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded ${
                          sub.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-400">
                      {new Intl.DateTimeFormat("mr-IN", { dateStyle: "short" }).format(
                        new Date(sub.createdAt)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
