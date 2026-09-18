"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, MessageSquare, Newspaper, Menu, X, User } from "lucide-react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const currentDate = new Intl.DateTimeFormat("mr-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <header className="w-full bg-[#FAFAF8] border-b border-gray-200">
      {/* Top Utility Bar */}
      <div className="bg-gray-900 text-gray-200 text-xs py-1.5 px-4 border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-white tracking-wide">
              {currentDate}
            </span>
            <span className="hidden sm:inline-block text-gray-400">|</span>
            <span className="hidden sm:inline-block text-gray-300">
              📍 जामखेड: ३१°C • स्वच्छ हवामान
            </span>
            <span className="hidden md:inline-block text-gray-400">|</span>
            <span className="hidden md:inline-block bg-red-800 text-white px-2 py-0.5 rounded text-[11px] font-bold">
              जामखेड व अहिल्यानगर आवृत्ती
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/subscribe"
              className="flex items-center gap-1 text-green-400 hover:text-green-300 font-bold transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>व्हॉट्सॲप बुलेटिन</span>
            </Link>
            <span className="text-gray-600">|</span>
            <Link
              href="/epaper"
              className="flex items-center gap-1 text-yellow-400 hover:text-yellow-300 font-bold transition-colors"
            >
              <Newspaper className="w-3.5 h-3.5" />
              <span>ई-पेपर</span>
            </Link>
            <span className="text-gray-600">|</span>
            <Link
              href="/admin"
              className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span>न्यूजरूम लॉगिन</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Masthead Banner */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left Decorative/Weather Info on Desktop */}
          <div className="hidden lg:block w-1/4 text-left">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              दैनिक डिजिटल आवृत्ती
            </p>
            <p className="text-sm font-bold text-gray-800 mt-0.5">
              नोंदणी क्र. : AJ/2026/AH
            </p>
            <p className="text-xs text-red-700 font-semibold mt-1">
              • २४x७ स्थानिक डिजिटल बातमीपत्र
            </p>
          </div>

          {/* Center Brand Identity */}
          <div className="text-center flex-1">
            <Link href="/" className="inline-block group">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-gray-950 font-headline group-hover:text-red-800 transition-colors">
                आवाज जामखेडचा
              </h1>
            </Link>
            <div className="flex items-center justify-center gap-3 mt-1.5">
              <div className="h-[2px] w-8 sm:w-16 bg-red-800"></div>
              <p className="text-xs sm:text-sm font-bold text-gray-700 tracking-wider">
                जामखेड आणि पंचक्रोशीचा बुलंद आवाज
              </p>
              <div className="h-[2px] w-8 sm:w-16 bg-red-800"></div>
            </div>
          </div>

          {/* Right Search Box & Actions */}
          <div className="w-full md:w-auto md:min-w-[260px] flex items-center justify-end gap-2">
            <form onSubmit={handleSearch} className="relative w-full max-w-xs">
              <input
                type="text"
                placeholder="बातमी, गाव किंवा विषय शोधा..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs sm:text-sm bg-white border border-gray-300 rounded-full py-2 pl-3 pr-9 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 shadow-sm"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-red-800 hover:bg-red-700 text-white p-1.5 rounded-full transition-colors"
                aria-label="Search"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-800 hover:bg-gray-100 rounded-md border border-gray-300"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 px-4 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm font-bold text-gray-800">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 hover:bg-red-50 hover:text-red-800 rounded border border-gray-100"
            >
              मुख्य पृष्ठ
            </Link>
            <Link
              href="/category/politics"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 hover:bg-red-50 hover:text-red-800 rounded border border-gray-100"
            >
              राजकारण
            </Link>
            <Link
              href="/category/agriculture"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 hover:bg-red-50 hover:text-red-800 rounded border border-gray-100"
            >
              शेती व बाजारभाव
            </Link>
            <Link
              href="/category/local-news"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 hover:bg-red-50 hover:text-red-800 rounded border border-gray-100"
            >
              स्थानिक घडामोडी
            </Link>
            <Link
              href="/category/crime"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 hover:bg-red-50 hover:text-red-800 rounded border border-gray-100"
            >
              गुन्हेगारी
            </Link>
            <Link
              href="/category/govt-schemes"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 hover:bg-red-50 hover:text-red-800 rounded border border-gray-100"
            >
              शासन योजना
            </Link>
            <Link
              href="/epaper"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 bg-yellow-50 text-yellow-900 font-bold rounded border border-yellow-200"
            >
              ई-पेपर कात्रण
            </Link>
            <Link
              href="/subscribe"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 bg-green-50 text-green-900 font-bold rounded border border-green-200"
            >
              व्हॉट्सॲप बुलेटिन
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

