"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { AdPlacement } from "@/lib/ads";

interface AdData {
  id: string;
  advertiser: string;
  bannerUrl: string;
  destinationUrl: string;
  placement: string;
}

interface AdSlotProps {
  placement: AdPlacement;
  device?: string;
  className?: string;
}

export default function AdSlot({
  placement,
  device = "ALL",
  className = "",
}: AdSlotProps) {
  const [ad, setAd] = useState<AdData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function fetchAd() {
      try {
        const res = await fetch(`/api/ads?placement=${placement}&device=${device}`);
        if (res.ok) {
          const data = await res.json();
          if (data.ad) {
            setAd(data.ad);
            // Record impression
            fetch(`/api/ads/impression`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ adId: data.ad.id }),
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.error("Ad loading error:", err);
      } finally {
        setLoaded(true);
      }
    }

    fetchAd();
  }, [placement, device]);

  const handleAdClick = () => {
    if (ad) {
      fetch(`/api/ads/click`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId: ad.id }),
      }).catch(() => {});
    }
  };

  // Dimensions based on placement to prevent Cumulative Layout Shift (CLS)
  const getMinHeight = () => {
    switch (placement) {
      case "HEADER":
      case "TOP_BANNER":
        return "min-h-[90px] sm:min-h-[120px]";
      case "SIDEBAR":
        return "min-h-[250px] sm:min-h-[300px]";
      case "ARTICLE_MIDDLE":
      case "ARTICLE_BOTTOM":
        return "min-h-[100px] sm:min-h-[150px]";
      case "MOBILE_STICKY":
        return "min-h-[50px]";
      default:
        return "min-h-[90px]";
    }
  };

  return (
    <div
      className={`w-full my-4 flex flex-col items-center justify-center overflow-hidden rounded-lg bg-gray-50 border border-dashed border-gray-300 p-2 text-center ${getMinHeight()} ${className}`}
    >
      <div className="w-full flex items-center justify-between text-[10px] text-gray-400 uppercase font-semibold mb-1 px-1">
        <span>जाहिरात (Advertisement)</span>
        {ad && <span>{ad.advertiser}</span>}
      </div>

      {ad ? (
        <a
          href={ad.destinationUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={handleAdClick}
          className="relative w-full h-full flex items-center justify-center group overflow-hidden rounded"
        >
          <img
            src={ad.bannerUrl}
            alt={ad.advertiser}
            className="max-h-60 w-auto object-contain rounded group-hover:opacity-95 transition-opacity"
            loading="lazy"
          />
          <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            भेट द्या <ExternalLink className="w-2.5 h-2.5" />
          </span>
        </a>
      ) : (
        <div className="text-xs text-gray-400 font-medium py-3">
          {loaded
            ? "येथे आपली जाहिरात देण्यासाठी संपर्क करा: advt@awaazjamkhed.com"
            : "जाहिरात लोड होत आहे..."}
        </div>
      )}
    </div>
  );
}

