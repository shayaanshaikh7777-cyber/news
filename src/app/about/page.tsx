import React from "react";
import Header from "@/components/public/Header";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { ShieldCheck, Award, Users, Newspaper, MapPin, Mail, Phone } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "आमच्याबद्दल (About Us) | आवाज जामखेडचा",
  description: "आवाज जामखेडचा डिजिटल वृत्तपत्र, आमचे ध्येय, संपादकीय मंडळ आणि डिजिटल पत्रकारिता आचारसंहिता.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-10 flex-1 w-full">
        {/* Title Header */}
        <div className="pb-4 border-b-2 border-red-800 mb-8">
          <span className="text-xs font-bold text-red-700 uppercase tracking-widest bg-red-100 px-3 py-1 rounded-full">
            अधिकृत परिचय
          </span>
          <h1 className="text-3xl sm:text-4xl font-black font-headline text-gray-950 mt-3">
            आमच्याबद्दल (About Awaaz Jamkhedcha)
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            जामखेड आणि पंचक्रोशीतील निर्भीड, निष्पक्ष आणि वेगवान स्थानिक डिजिटल वृत्तपत्र
          </p>
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6 text-gray-800 leading-relaxed text-sm sm:text-base">
          <div>
            <h2 className="text-xl font-bold text-gray-950 flex items-center gap-2 mb-2 font-headline">
              <Newspaper className="w-5 h-5 text-red-700" />
              <span>आमची भूमिका व ध्येय</span>
            </h2>
            <p className="text-gray-700">
              <strong>'आवाज जामखेडचा'</strong> हे जामखेड तालुका, अहिल्यानगर जिल्हा आणि पंचक्रोशीतील जनसामान्यांच्या हक्कासाठी, शेतकरी बांधवांसाठी, आणि स्थानिक विकासासाठी समर्पित डिजिटल माध्यम आहे. ग्रामीण व निमशहरी भागातील समस्या थेट प्रशासनापर्यंत पोहोचवणे आणि जनतेला सत्य, वस्तुनिष्ठ आणि विश्वासार्ह माहिती देणे हे आमचे मूळ उद्दिष्ट आहे.
            </p>
          </div>

          <hr className="border-gray-100" />

          <div>
            <h2 className="text-xl font-bold text-gray-950 flex items-center gap-2 mb-2 font-headline">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              <span>डिजिटल मीडिया आचारसंहिता</span>
            </h2>
            <p className="text-gray-700">
              आम्ही माहिती तंत्रज्ञान (मध्यस्थ मार्गदर्शक तत्त्वे आणि डिजिटल मीडिया आचारसंहिता) नियम २०२१ चे पूर्णपणे पालन करतो. खोटी माहिती, अफवा किंवा प्रक्षोभक मजकुरास आमच्या व्यासपीठावर कोणताही थारा नाही. प्रत्येक बातमीची सत्यता पडताळूनच ती प्रसिद्ध केली जाते.
            </p>
          </div>

          <hr className="border-gray-100" />

          <div>
            <h2 className="text-xl font-bold text-gray-950 flex items-center gap-2 mb-3 font-headline">
              <Users className="w-5 h-5 text-blue-600" />
              <span>संपादकीय मंडळ (Editorial Team)</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="font-bold text-gray-950">सुनील गायकवाड</p>
                <p className="text-xs text-red-700 font-bold mt-0.5">मुख्य संपादक (Chief Editor)</p>
                <p className="text-xs text-gray-500 mt-2">स्थानिक पत्रकारितेतील १५+ वर्षांचा प्रदीर्घ अनुभव.</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="font-bold text-gray-950">बाळकृष्ण देशमुख</p>
                <p className="text-xs text-blue-700 font-bold mt-0.5">वरिष्ठ बातमीदार व तक्रार निवारण अधिकारी</p>
                <p className="text-xs text-gray-500 mt-2">ग्रामीण विकास, कृषी व प्रशासकीय वार्तांकन प्रमुख.</p>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          <div>
            <h2 className="text-xl font-bold text-gray-950 flex items-center gap-2 mb-2 font-headline">
              <MapPin className="w-5 h-5 text-red-700" />
              <span>मुख्य कार्यालय व संपर्क</span>
            </h2>
            <p className="text-sm text-gray-600">
              संपादकीय कार्यालय: खर्डा रोड, बस स्टँडजवळ, जामखेड, पिन - ४१३२०१, जि. अहिल्यानगर, महाराष्ट्र.<br />
              ईमेल: <strong>editor@awaazjamkhed.com</strong> | फोन: <strong>+९१ ९४२३० ०००००</strong>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

