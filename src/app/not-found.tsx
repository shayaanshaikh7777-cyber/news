import React from "react";
import Link from "next/link";
import Header from "@/components/public/Header";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { Home, Search, ArrowLeft, Newspaper } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] font-marathi">
      <Header />
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 text-center flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-red-100 text-red-800 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
          <Newspaper className="w-10 h-10" />
        </div>

        <span className="text-sm font-bold text-red-700 tracking-wider uppercase mb-2">
          त्रुटी ४०४ (Page Not Found)
        </span>

        <h1 className="text-3xl sm:text-5xl font-black font-headline text-gray-950 mb-4">
          हे पान सापडले नाही
        </h1>

        <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto mb-8 leading-relaxed">
          तुम्ही शोधत असलेली बातमी किंवा पान अस्तित्वात नाही किंवा ते दुसऱ्या पत्त्यावर हलवले गेले असावे.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-red-800 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow hover:shadow-md text-sm"
          >
            <Home className="w-4 h-4" />
            <span>मुख्य पानावर जा (Home)</span>
          </Link>

          <Link
            href="/search"
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-800 font-bold px-6 py-3 rounded-xl transition-all border border-gray-300 text-sm shadow-xs"
          >
            <Search className="w-4 h-4" />
            <span>बातम्या शोधा (Search)</span>
          </Link>

          <Link
            href="/admin/login"
            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-black text-white font-bold px-6 py-3 rounded-xl transition-all text-sm shadow-xs"
          >
            <span>न्यूजरूम सीएमएस (Admin)</span>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
