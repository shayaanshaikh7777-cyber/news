"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Flame, Video, Newspaper } from "lucide-react";

export const CATEGORY_LINKS = [
  { name: "मुख्य पृष्ठ", href: "/" },
  { name: "राजकारण", href: "/category/politics" },
  { name: "शेती व बाजारभाव", href: "/category/agriculture" },
  { name: "स्थानिक घडामोडी", href: "/category/local-news" },
  { name: "गुन्हेगारी", href: "/category/crime" },
  { name: "शासन योजना", href: "/category/govt-schemes" },
  { name: "शिक्षण व नोकरी", href: "/category/education" },
  { name: "क्रीडा", href: "/category/sports" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="w-full bg-red-900 text-white sticky top-0 z-40 shadow-md border-t-2 border-red-950">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between overflow-x-auto no-scrollbar">
        <div className="flex items-center space-x-1 sm:space-x-2 py-0.5 whitespace-nowrap text-xs sm:text-sm font-bold">
          {CATEGORY_LINKS.map((cat) => {
            const isActive = pathname === cat.href;
            return (
              <Link
                key={cat.href}
                href={cat.href}
                className={`px-3 py-3 transition-colors inline-block border-b-2 ${
                  isActive
                    ? "border-yellow-400 text-yellow-300 bg-red-950/40"
                    : "border-transparent hover:text-yellow-200 hover:bg-red-800/60"
                }`}
              >
                {cat.name}
              </Link>
            );
          })}

          <Link
            href="/category/video-news"
            className="flex items-center gap-1 px-3 py-3 text-red-200 hover:text-white hover:bg-red-800/60 transition-colors border-b-2 border-transparent"
          >
            <Video className="w-4 h-4 text-yellow-400" />
            <span>व्हिडिओ</span>
          </Link>

          <Link
            href="/trending"
            className="flex items-center gap-1 px-3 py-3 text-yellow-300 hover:text-yellow-200 hover:bg-red-800/60 transition-colors border-b-2 border-transparent"
          >
            <Flame className="w-4 h-4 text-orange-400" />
            <span>ट्रेंडिंग</span>
          </Link>
        </div>

        {/* Highlighted "News from my village" Action */}
        <div className="hidden lg:flex items-center pl-4 py-1.5 border-l border-red-800">
          <Link
            href="/location/jamkhed-city"
            className="flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-gray-950 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide transition-all shadow-sm transform hover:scale-105"
          >
            <MapPin className="w-3.5 h-3.5 text-red-900" />
            <span>माझ्या गावातील बातम्या</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

