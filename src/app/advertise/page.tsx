import React from "react";
import Header from "@/components/public/Header";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { Megaphone, CheckCircle2, TrendingUp, Users, Target, Phone, Mail } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "जाहिरात द्या (Advertise With Us) | आवाज जामखेडचा",
  description: "जामखेड आणि पंचक्रोशीतील लाखो वाचकांपर्यंत आपला व्यवसाय पोहोचवा. डिजिटल बॅनर, स्पॉन्सर्ड पोस्ट्स आणि व्हॉट्सॲप जाहिरात.",
};

export default function AdvertisePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-10 flex-1 w-full">
        <div className="pb-4 border-b-2 border-red-800 mb-8">
          <span className="text-xs font-bold text-red-700 uppercase tracking-widest bg-red-100 px-3 py-1 rounded-full">
            स्थानिक व्यवसाय वृद्धी
          </span>
          <h1 className="text-3xl sm:text-4xl font-black font-headline text-gray-950 mt-3">
            जाहिरात द्या (Advertise With Us)
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            जामखेड तालुका, कर्जत, आष्टी आणि अहिल्यानगर परिसरातील सर्वात लोकप्रिय स्थानिक डिजिटल व्यासपीठ
          </p>
        </div>

        {/* Why Advertise Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-gray-950 font-headline">५०,०००+</p>
            <p className="text-xs text-gray-500 mt-1 font-bold">मासिक सक्रिय स्थानिक वाचक</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center">
            <div className="w-12 h-12 rounded-xl bg-green-100 text-green-700 flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-gray-950 font-headline">१००%</p>
            <p className="text-xs text-gray-500 mt-1 font-bold">टार्गेटेड स्थानिक ग्राहक (Jamkhed Region)</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-gray-950 font-headline">उच्च ROI</p>
            <p className="text-xs text-gray-500 mt-1 font-bold">परवडणारे व परिणामकारक जाहिरात दर</p>
          </div>
        </div>

        {/* Ad Packages */}
        <h2 className="text-xl sm:text-2xl font-black font-headline text-gray-950 mb-6">
          जाहिरात पर्याय व पॅकेजेस
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-red-700 transition-colors shadow-sm">
            <h3 className="text-lg font-bold text-gray-950">हेडर टॉप बॅनर</h3>
            <p className="text-xs text-gray-500 mt-1">वेबसाईट उघडताच दिसणारा मुख्य बॅनर</p>
            <p className="text-2xl font-black text-red-700 font-headline mt-4">₹२,९९९ / महिना</p>
            <ul className="mt-4 space-y-2 text-xs text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>डेस्कटॉप व मोबाईल दोन्हीवर दृश्य</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>थेट व्हॉट्सॲप / कॉल लिंक</span>
              </li>
            </ul>
          </div>

          <div className="bg-red-950 text-white rounded-2xl p-6 border-2 border-red-700 shadow-lg relative overflow-hidden">
            <span className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
              सर्वात लोकप्रिय
            </span>
            <h3 className="text-lg font-bold text-white">बातम्यांच्या मधील बॅनर</h3>
            <p className="text-xs text-gray-300 mt-1">प्रत्येक वाचक बातमी वाचताना दिसतो</p>
            <p className="text-2xl font-black text-yellow-400 font-headline mt-4">₹१,९९९ / महिना</p>
            <ul className="mt-4 space-y-2 text-xs text-gray-200">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                <span>सर्व बातमी पानांवर उच्च दृश्यमानता</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                <span>क्लिक व इम्प्रेशन रिपोर्टिंग</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-red-700 transition-colors shadow-sm">
            <h3 className="text-lg font-bold text-gray-950">व्हॉट्सॲप बुलेटिन स्पॉन्सर</h3>
            <p className="text-xs text-gray-500 mt-1">दररोज ५०००+ वाचकांच्या मोबाईलवर थेट</p>
            <p className="text-2xl font-black text-red-700 font-headline mt-4">₹३,५०० / महिना</p>
            <ul className="mt-4 space-y-2 text-xs text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>दैनिक सकाळच्या बुलेटिनमध्ये बॅनर</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>थेट व्यवसाय चौकशी मिळवा</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact to book */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-gray-950 font-headline">
              जाहिरात बुक करण्यासाठी त्वरित संपर्क साधा
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              आमचे जाहिरात प्रतिनिधी आपल्या व्यवसायासाठी योग्य प्लॅन तयार करून देतील.
            </p>
          </div>
          <a
            href="tel:+919423000000"
            className="bg-red-700 hover:bg-red-800 text-white px-6 py-3 rounded-xl font-bold text-sm shadow transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Phone className="w-4 h-4" />
            <span>+९१ ९४२३० ०००००</span>
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}

