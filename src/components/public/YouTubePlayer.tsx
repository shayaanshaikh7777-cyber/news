"use client";

import React, { useState } from "react";
import { extractYouTubeVideoId, getYouTubeEmbedUrl } from "@/lib/youtube";
import { Play, ExternalLink } from "lucide-react";

export default function YouTubePlayer({
  url,
  title = "बातमी व्हिडिओ",
}: {
  url?: string | null;
  title?: string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoId = extractYouTubeVideoId(url);

  if (!videoId) {
    return null;
  }

  const embedUrl = getYouTubeEmbedUrl(videoId);
  const youtubeWatchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  return (
    <div className="w-full my-6 bg-gray-900 rounded-xl overflow-hidden border border-gray-800 shadow-md">
      <div className="relative aspect-video w-full bg-black">
        {isPlaying ? (
          <iframe
            src={`${embedUrl}?autoplay=1&rel=0`}
            title={title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div
            onClick={() => setIsPlaying(true)}
            className="relative w-full h-full cursor-pointer group flex items-center justify-center"
            style={{
              backgroundImage: `url(${thumbnail})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all"></div>

            {/* Red YouTube-style Play Button */}
            <div className="relative z-10 w-16 h-12 bg-red-700 group-hover:bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-2xl transform group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 fill-white ml-0.5" />
            </div>

            <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between text-xs text-white drop-shadow">
              <span className="font-bold truncate">{title}</span>
              <span className="bg-black/60 px-2 py-0.5 rounded font-mono">व्हिडिओ सुरू करा</span>
            </div>
          </div>
        )}
      </div>

      {/* External Action Bar */}
      <div className="bg-gray-950 px-4 py-2.5 flex items-center justify-between text-xs text-gray-300 border-t border-gray-800">
        <span className="font-semibold text-gray-400">आवाज जामखेडचा अधिकृत व्हिडिओ डेस्क</span>
        <a
          href={youtubeWatchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-red-400 hover:text-red-300 font-bold transition-colors"
        >
          <span>YouTube वर पाहा (Watch on YouTube)</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

