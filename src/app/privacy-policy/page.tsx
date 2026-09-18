import React from "react";
import Header from "@/components/public/Header";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { ShieldCheck, Lock, Eye, Cookie } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "गोपनीयता धोरण (Privacy Policy) | आवाज जामखेडचा",
  description: "आवाज जामखेडचा डिजिटल वृत्तपत्राचे गोपनीयता धोरण आणि डेटा संरक्षण नियम.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-10 flex-1 w-full">
        <div className="pb-4 border-b-2 border-red-800 mb-8">
          <span className="text-xs font-bold text-red-700 uppercase tracking-widest bg-red-100 px-3 py-1 rounded-full">
            कायदेशीर माहिती
          </span>
          <h1 className="text-3xl sm:text-4xl font-black font-headline text-gray-950 mt-3">
            गोपनीयता धोरण (Privacy Policy)
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            शेवटचे अपडेट: सप्टेंबर २०२६ | माहिती तंत्रज्ञान नियम व डिजिटल मीडिया मानकांनुसार
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6 text-gray-800 text-sm sm:text-base leading-relaxed">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-950 flex items-center gap-2 mb-2 font-headline">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              <span>१. प्रस्तावना</span>
            </h2>
            <p className="text-gray-700">
              <strong>'आवाज जामखेडचा'</strong> (Awaaz Jamkhedcha) हे वाचकांच्या गोपनीयतेचा पूर्ण आदर करते. आमच्या पोर्टलचा वापर करताना वापरकर्त्यांची कोणतीही वैयक्तिक माहिती सुरक्षित ठेवणे ही आमची प्राथमिकता आहे.
            </p>
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-950 flex items-center gap-2 mb-2 font-headline">
              <Eye className="w-5 h-5 text-blue-600" />
              <span>२. आम्ही कोणती माहिती गोळा करतो?</span>
            </h2>
            <ul className="list-disc list-inside space-y-1.5 text-gray-700 text-xs sm:text-sm">
              <li><strong>स्वैच्छिक माहिती:</strong> व्हॉट्सॲप बुलेटिन सबस्क्रिप्शन, बातमीदार नोंदणी किंवा संपर्क फॉर्म भरताना दिलेले नाव, फोन नंबर आणि गाव.</li>
              <li><strong>तांत्रिक माहिती:</strong> डिव्हाइस प्रकार, ब्राउझर व्हर्जन, आयपी ॲड्रेस आणि बातमी वाचनाचा कालावधी (फक्त अनामिक विश्लेषणासाठी).</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-950 flex items-center gap-2 mb-2 font-headline">
              <Cookie className="w-5 h-5 text-yellow-600" />
              <span>३. कुकीज (Cookies) आणि जाहिराती</span>
            </h2>
            <p className="text-gray-700 text-xs sm:text-sm">
              आमच्या पोर्टलवर गुगल ॲडसेन्स (Google AdSense) व स्थानिक जाहिराती दाखवल्या जातात. गुगल कुकीजच्या माध्यमातून वाचकांच्या आवडीनुसार योग्य जाहिराती दाखवते. वाचक त्यांच्या ब्राउझर सेटिंग्जमधून कुकीज बंद करू शकतात.
            </p>
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-950 flex items-center gap-2 mb-2 font-headline">
              <Lock className="w-5 h-5 text-red-600" />
              <span>४. डेटा सुरक्षा व तृतीय पक्ष</span>
            </h2>
            <p className="text-gray-700 text-xs sm:text-sm">
              आम्ही तुमचा कोणताही वैयक्तिक डेटा कोणत्याही व्यावसायिक कंपनीला किंवा त्रयस्थ पक्षाला विकत नाही. सर्व डेटा सुरक्षित सर्व्हरवर एनक्रिप्टेड पद्धतीने साठवला जातो.
            </p>
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-950 mb-2 font-headline">
              ५. संपर्क व तक्रार निवारण
            </h2>
            <p className="text-gray-700 text-xs sm:text-sm">
              गोपनीयता धोरणाबाबत काही प्रश्न किंवा तक्रार असल्यास आमचे तक्रार निवारण अधिकारी यांच्याशी <strong>privacy@awaazjamkhed.com</strong> वर संपर्क साधावा.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

