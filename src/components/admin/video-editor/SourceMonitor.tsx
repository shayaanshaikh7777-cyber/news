"use client";

import React, { useState, useRef } from "react";
import { Play, Pause, RotateCcw, Plus, BookmarkCheck } from "lucide-react";

interface SourceMonitorProps {
  assetUrl?: string | null;
  assetTitle?: string | null;
  onInsertToTimeline: (inPoint: number, outPoint: number) => void;
}

export function SourceMonitor({
  assetUrl,
  assetTitle,
  onInsertToTimeline,
}: SourceMonitorProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [inPoint, setInPoint] = useState<number | null>(null);
  const [outPoint, setOutPoint] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 0);
    setInPoint(0);
    setOutPoint(videoRef.current.duration || 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
    setCurrentTime(val);
  };

  const markIn = () => setInPoint(currentTime);
  const markOut = () => setOutPoint(currentTime);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 100);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 border border-gray-800 rounded-xl overflow-hidden shadow-inner text-xs">
      {/* Monitor Header */}
      <div className="bg-gray-900/90 px-3 py-1.5 border-b border-gray-800 flex items-center justify-between text-gray-300">
        <span className="font-bold text-[11px] text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-yellow-400" />
          <span>सोर्स मॉनिटर (Raw Footage)</span>
        </span>
        <span className="text-[10px] text-gray-400 truncate max-w-[180px]">
          {assetTitle || "फूटज निवडा"}
        </span>
      </div>

      {/* Video Viewport */}
      <div className="flex-1 bg-black flex items-center justify-center relative min-h-[160px]">
        {assetUrl ? (
          <video
            ref={videoRef}
            src={assetUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <div className="text-gray-600 text-center p-4">
            <p className="font-bold text-xs">कोणतीही क्लिप लोड नाही</p>
            <p className="text-[10px] text-gray-700 mt-1">डाव्या बाजूने कच्ची व्हिडिओ क्लिप निवडा</p>
          </div>
        )}
      </div>

      {/* Scrub Bar */}
      <div className="px-3 pt-2 bg-gray-900/60">
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.05}
          value={currentTime}
          onChange={handleSeek}
          disabled={!assetUrl}
          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
        />
        <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="p-2 bg-gray-900 border-t border-gray-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePlayPause}
            disabled={!assetUrl}
            className="p-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded transition disabled:opacity-30"
            title="Play / Pause"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>
          <button
            type="button"
            onClick={() => {
              if (videoRef.current) videoRef.current.currentTime = 0;
            }}
            disabled={!assetUrl}
            className="p-1.5 text-gray-400 hover:text-white rounded"
            title="रिसेट"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mark In / Out buttons */}
        <div className="flex items-center gap-1 bg-gray-950 p-0.5 rounded border border-gray-800 text-[10px]">
          <button
            type="button"
            onClick={markIn}
            disabled={!assetUrl}
            className="px-2 py-0.5 text-yellow-400 hover:bg-gray-800 rounded font-bold"
            title="Mark In Point ([)"
          >
            [ IN
          </button>
          <button
            type="button"
            onClick={markOut}
            disabled={!assetUrl}
            className="px-2 py-0.5 text-yellow-400 hover:bg-gray-800 rounded font-bold"
            title="Mark Out Point (])"
          >
            OUT ]
          </button>
        </div>

        {/* Insert To Timeline */}
        <button
          type="button"
          onClick={() => onInsertToTimeline(inPoint || 0, outPoint || duration || 5)}
          disabled={!assetUrl}
          className="flex items-center gap-1 bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-black px-2.5 py-1 rounded text-[11px] transition disabled:opacity-30"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>टाइमलाइनवर टाका</span>
        </button>
      </div>
    </div>
  );
}
