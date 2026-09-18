"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ChevronRight } from "lucide-react";

interface BreakingItem {
  id: string;
  title: string;
  linkUrl?: string | null;
}

export default function BreakingTicker({ items = [] }: { items?: BreakingItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [items.length]);

  if (!items || items.length === 0) {
    return null;
  }

  const current = items[currentIndex];

  return (
    <div className="w-full bg-red-950 text-white border-b-2 border-red-700 overflow-hidden shadow-inner">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3 text-xs sm:text-sm">
        {/* Pulsing Breaking Badge */}
        <div className="flex items-center gap-1.5 bg-red-600 px-2.5 py-1 rounded font-black text-[11px] sm:text-xs tracking-wider uppercase whitespace-nowrap animate-pulse">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>ब्रेकिंग न्यूज</span>
        </div>

        {/* Ticker Text with Link */}
        <div className="flex-1 overflow-hidden">
          <div className="transition-all duration-500 ease-in-out">
            {current.linkUrl ? (
              <Link
                href={current.linkUrl}
                className="hover:underline flex items-center justify-between group font-semibold text-gray-100 hover:text-white"
              >
                <span className="truncate">{current.title}</span>
                <span className="hidden sm:inline-flex items-center text-xs text-red-300 group-hover:text-white ml-2">
                  वाचा <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ) : (
              <span className="font-semibold text-gray-100 truncate block">
                {current.title}
              </span>
            )}
          </div>
        </div>

        {/* Counter indicator if multiple */}
        {items.length > 1 && (
          <div className="hidden sm:block text-[11px] text-red-300 font-mono">
            {currentIndex + 1}/{items.length}
          </div>
        )}
      </div>
    </div>
  );
}

