"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Search } from "lucide-react";

interface VillageItem {
  village: string;
  slug: string;
  taluka: string;
  isHotspot?: boolean;
}

export default function VillagePicker({ villages = [] }: { villages?: VillageItem[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = villages.filter(
    (v) =>
      v.village.toLowerCase().includes(search.toLowerCase()) ||
      v.taluka.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (slug: string) => {
    router.push(`/location/${slug}`);
  };

  return (
    <section className="w-full my-8 bg-gradient-to-r from-red-950 via-red-900 to-red-950 text-white rounded-xl p-6 shadow-md border border-red-800">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 bg-yellow-400 text-gray-950 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider mb-2">
            <MapPin className="w-3 h-3 text-red-900" />
            <span>हायपर-लोकल पत्रकारिता</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black font-headline">
            माझ्या गावातील बातम्या (News from my Village)
          </h3>
          <p className="text-sm text-red-100 mt-1">
            जामखेड तालुका व परिसरातील खर्डा, चोंडी, हळगाव, नानज यासह आपल्या गावाची ताजी बातमी निवडा:
          </p>
        </div>

        {/* Dropdown / Search Filter */}
        <div className="w-full md:w-80 flex flex-col gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="गावाचे नाव टाईप करा..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white text-gray-900 text-sm px-3 py-2 pl-9 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <select
            onChange={(e) => e.target.value && handleSelect(e.target.value)}
            defaultValue=""
            className="w-full bg-red-800 text-white text-sm px-3 py-2 rounded-lg border border-red-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 cursor-pointer font-bold"
          >
            <option value="" disabled>
              -- आपले गाव निवडा ({filtered.length} गावे) --
            </option>
            {filtered.map((v) => (
              <option key={v.slug} value={v.slug} className="text-gray-900 bg-white">
                {v.village} ({v.taluka}) {v.isHotspot ? "★" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Pills for Major Hotspots */}
      <div className="mt-4 pt-4 border-t border-red-800/80 flex items-center gap-2 flex-wrap text-xs">
        <span className="font-bold text-yellow-300">प्रमुख गावे:</span>
        {villages
          .filter((v) => v.isHotspot)
          .map((v) => (
            <button
              key={v.slug}
              onClick={() => handleSelect(v.slug)}
              className="bg-white/10 hover:bg-yellow-400 hover:text-gray-950 px-2.5 py-1 rounded-full transition-all border border-white/20 font-semibold"
            >
              📍 {v.village}
            </button>
          ))}
      </div>
    </section>
  );
}

