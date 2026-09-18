import React from "react";
import Header from "@/components/public/Header";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { Mail, Phone, MapPin, MessageSquare, Send, Clock, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "संपर्क व बातमी पाठवा (Contact Us) | आवाज जामखेडचा",
  description: "आवाज जामखेडचा न्यूजरूमशी संपर्क साधा, स्थानिक बातम्या, फोटो, व्हिडिओ व जाहिरात चौकशी.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-10 flex-1 w-full">
        <div className="pb-4 border-b-2 border-red-800 mb-8">
          <span className="text-xs font-bold text-red-700 uppercase tracking-widest bg-red-100 px-3 py-1 rounded-full">
            न्यूजरूम हेल्पलाइन
          </span>
          <h1 className="text-3xl sm:text-4xl font-black font-headline text-gray-950 mt-3">
            संपर्क व बातमी पाठवा (Contact Us)
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            आपल्या गावातील, परिसरातील बातमी, समस्या किंवा जाहिरातीसाठी थेट आमच्याशी संपर्क करा
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Details Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-gray-950 font-headline pb-2 border-b border-gray-100">
              संपादकीय कार्यालय
            </h2>

            <div className="space-y-4 text-sm text-gray-700">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-gray-950">पत्ता:</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    आवाज जामखेडचा कार्यालय, खर्डा रोड, बस स्टँडजवळ, जामखेड - ४१३२०१, जि. अहिल्यानगर, महाराष्ट्र.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-gray-950">दूरध्वनी व व्हॉट्सॲप:</p>
                  <p className="text-xs text-gray-600 mt-0.5">+९१ ९४२३० ००००० (बातम्या व जाहिरात)</p>
                  <p className="text-xs text-gray-600">+९१ २४२१ २२२००० (कार्यालयीन)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-gray-950">ईमेल:</p>
                  <p className="text-xs text-gray-600 mt-0.5">editor@awaazjamkhed.com</p>
                  <p className="text-xs text-gray-600">contact@awaazjamkhed.com</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-yellow-100 text-yellow-800 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-gray-950">कार्यालयीन वेळ:</p>
                  <p className="text-xs text-gray-600 mt-0.5">सकाळी ८:०० ते रात्री ९:०० (दररोज)</p>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Tip Button */}
            <div className="pt-2">
              <a
                href="https://wa.me/919423000000?text=नमस्कार,%20माझ्याकडे%20एक%20बातमी%20आहे."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white py-3 rounded-xl font-bold text-sm shadow transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>व्हॉट्सॲपवर बातमी पाठवा</span>
              </a>
            </div>
          </div>

          {/* Quick Contact Form */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-950 font-headline pb-2 border-b border-gray-100 mb-4">
              संदेश किंवा बातमी टिप पाठवा
            </h2>

            <form className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  आपले नाव *
                </label>
                <input
                  type="text"
                  required
                  placeholder="उदा. राहुल पवार"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  मोबाईल नंबर *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="उदा. 98xxxxxxxx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  गाव / शहर *
                </label>
                <input
                  type="text"
                  required
                  placeholder="उदा. जामखेड / खर्डा"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  बातमी किंवा संदेशाचा तपशील *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="घटना, समस्या किंवा माहिती सविस्तर लिहा..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-700 focus:outline-none"
                ></textarea>
              </div>

              <button
                type="button"
                className="w-full bg-red-800 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-sm shadow transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>माहिती पाठवा</span>
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

