"use client";

import React, { useState } from "react";
import { MessageSquare, Facebook, Twitter, Link as LinkIcon, Instagram, Check, Download } from "lucide-react";

interface SocialShareProps {
  headline: string;
  url: string;
  slug: string;
  isSticky?: boolean;
}

export default function SocialShare({
  headline,
  url,
  slug,
  isSticky = false,
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const [captionCopied, setCaptionCopied] = useState(false);

  // Exact requested WhatsApp message format:
  // [Article Title]
  // Jamkhed chi taza khabar vacha fakt "Awaaz Jamkhedcha" var:
  // [Article URL]
  const whatsappText = `${headline}\n\nJamkhed chi taza khabar vacha fakt "Awaaz Jamkhedcha" var:\n${url}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(headline)}&url=${encodeURIComponent(url)}&via=awaazjamkhedcha`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const copyInstagramCaption = () => {
    const caption = `🔴 ${headline}\n\nसविस्तर बातमी वाचण्यासाठी बायोमधील लिंक तपासा किंवा https://awaazjamkhed.com/news/${slug} ला भेट द्या.\n\n#Jamkhed #Ahilyanagar #Maharashtra #AwaazJamkhedcha #BreakingNews #MarathiNews`;
    navigator.clipboard.writeText(caption);
    setCaptionCopied(true);
    setTimeout(() => setCaptionCopied(false), 2500);
  };

  const containerClasses = isSticky
    ? "sticky top-20 z-30 bg-white/95 backdrop-blur-sm p-2 sm:p-3 rounded-xl border border-gray-200 shadow-sm flex flex-row lg:flex-col items-center justify-center gap-2"
    : "flex flex-wrap items-center gap-2 my-4 py-3 border-y border-gray-200";

  return (
    <div className={containerClasses}>
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:block text-center">
        शेअर करा:
      </span>

      {/* WhatsApp Share Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-transform active:scale-95"
        title="व्हॉट्सॲपवर शेअर करा"
      >
        <MessageSquare className="w-4 h-4 fill-white" />
        <span className="hidden sm:inline">व्हॉट्सॲप</span>
      </a>

      {/* Facebook Share Button */}
      <a
        href={facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 bg-[#1877F2] hover:bg-[#166FE5] text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-transform active:scale-95"
        title="फेसबुकवर शेअर करा"
      >
        <Facebook className="w-4 h-4 fill-white" />
        <span className="hidden sm:inline">फेसबुक</span>
      </a>

      {/* X / Twitter Button */}
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 bg-black hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-transform active:scale-95"
        title="X वर पोस्ट करा"
      >
        <Twitter className="w-4 h-4 fill-white" />
        <span className="hidden sm:inline">X (Twitter)</span>
      </a>

      {/* Instagram Option (Profile Link & Caption Copy) */}
      <div className="relative group inline-block">
        <button
          onClick={copyInstagramCaption}
          className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-95 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-transform active:scale-95"
          title="इन्स्टाग्राम कॅप्शन कॉपी करा"
        >
          <Instagram className="w-4 h-4" />
          <span className="hidden sm:inline">
            {captionCopied ? "कॅप्शन कॉपी झाले!" : "इन्स्टा"}
          </span>
        </button>
      </div>

      {/* Copy Link Button */}
      <button
        onClick={copyToClipboard}
        className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-300 shadow-sm transition-all active:scale-95"
        title="बातमीची लिंक कॉपी करा"
      >
        {copied ? <Check className="w-4 h-4 text-green-600" /> : <LinkIcon className="w-4 h-4" />}
        <span className="hidden sm:inline">{copied ? "कॉपी झाले!" : "लिंक कॉपी"}</span>
      </button>

      {/* Download Clipping Button */}
      <a
        href={`/api/clippings/generate?articleSlug=${slug}&format=WHATSAPP`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-transform active:scale-95"
        title="कात्रण (Clipping) डाउनलोड करा"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">कात्रण</span>
      </a>
    </div>
  );
}

