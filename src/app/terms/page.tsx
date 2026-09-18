import React from "react";
import Header from "@/components/public/Header";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { FileText, CheckCircle, AlertCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "नियम आणि अटी (Terms of Service) | आवाज जामखेडचा",
  description: "आवाज जामखेडचा डिजिटल न्यूज पोर्टल वापराचे नियम, अटी व कायदेशीर मार्गदर्शक तत्त्वे.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-10 flex-1 w-full">
        <div className="pb-4 border-b-2 border-red-800 mb-8">
          <span className="text-xs font-bold text-red-700 uppercase tracking-widest bg-red-100 px-3 py-1 rounded-full">
            वापरकर्ता करार
          </span>
          <h1 className="text-3xl sm:text-4xl font-black font-headline text-gray-950 mt-3">
            नियम आणि अटी (Terms & Conditions)
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            पोर्टलचा वापर करण्यापूर्वी कृपया खालील नियम काळजीपूर्वक वाचावेत.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6 text-gray-800 text-sm sm:text-base leading-relaxed">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-950 flex items-center gap-2 mb-2 font-headline">
              <FileText className="w-5 h-5 text-red-700" />
              <span>१. पोर्टलचा वापर</span>
            </h2>
            <p className="text-gray-700 text-xs sm:text-sm">
              'आवाज जामखेडचा' वरील सर्व बातम्या, लेख, फोटो आणि व्हिडिओ केवळ माहिती आणि वैयक्तिक वापरासाठी आहेत. आमच्या पूर्वपरवानगीशिवाय या मजकुराचा व्यावसायिक वापर करता येणार नाही.
            </p>
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-950 flex items-center gap-2 mb-2 font-headline">
              <CheckCircle className="w-5 h-5 text-green-700" />
              <span>२. बौद्धिक संपदा हक्क (Copyrights)</span>
            </h2>
            <p className="text-gray-700 text-xs sm:text-sm">
              पोर्टलवरील सर्व वृत्तपत्रीय मजकूर, लोगो, डिझाइन आणि ग्राफिक्सचे सर्व हक्क 'आवाज जामखेडचा' कडे राखीव आहेत. सोशल मीडियावर शेअर करताना मूळ स्रोत (क्रेडिट) देणे बंधनकारक आहे.
            </p>
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-950 flex items-center gap-2 mb-2 font-headline">
              <AlertCircle className="w-5 h-5 text-yellow-700" />
              <span>३. वाचक प्रतिक्रिया व मजकूर</span>
            </h2>
            <p className="text-gray-700 text-xs sm:text-sm">
              वाचकांनी कोणत्याही समाजात तेढ निर्माण करणारी, प्रक्षोभक, खोटी किंवा बदनामीकारक प्रतिक्रिया अथवा मजकूर पाठवू नये. असा मजकूर आढळल्यास तो तत्काळ हटवला जाईल व संबंधित कायद्यानुसार कारवाई केली जाईल.
            </p>
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-950 mb-2 font-headline">
              ४. न्यायक्षेत्र (Jurisdiction)
            </h2>
            <p className="text-gray-700 text-xs sm:text-sm">
              या पोर्टलच्या वापराशी संबंधित कोणत्याही कायदेशीर वादाचे अधिकारक्षेत्र जामखेड न्यायालय व अहिल्यानगर जिल्हा न्यायालयाच्या अंतर्गत राहील.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

