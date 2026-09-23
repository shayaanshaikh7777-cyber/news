"use client";

import React, { useRef } from "react";
import { CanvasRatio, GraphicOverlayItem, VideoClipItem } from "@/types/video-studio";
import { NEWS_GRAPHIC_FONTS } from "@/lib/video-editor/graphics";
import { Play, Pause, Square, Maximize, Shield, Volume2 } from "lucide-react";

interface ProgramMonitorProps {
  canvasRatio: CanvasRatio;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  videoClips: VideoClipItem[];
  graphics: GraphicOverlayItem[];
  showSafeZones: boolean;
  selectedGraphicId?: string | null;
  onSelectGraphic?: (id: string) => void;
}

export function ProgramMonitor({
  canvasRatio,
  currentTime,
  duration,
  isPlaying,
  onTogglePlay,
  onSeek,
  videoClips,
  graphics,
  showSafeZones,
  selectedGraphicId,
  onSelectGraphic,
}: ProgramMonitorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Find active video / image clip on V1 / V2
  const activeClip = videoClips.find(
    (c) => currentTime >= c.startTime && currentTime <= c.startTime + c.duration
  );

  // Find active graphics on V3 / V4
  const activeGraphics = graphics.filter(
    (g) => currentTime >= g.startTime && currentTime <= g.startTime + g.duration
  );

  const formatTimecode = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    const f = Math.floor((secs % 1) * 30); // 30 fps
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}:${String(f).padStart(2, "0")}`;
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  // Aspect ratio class calculation
  const aspectClass =
    canvasRatio === "9:16"
      ? "aspect-[9/16] max-h-[380px]"
      : canvasRatio === "1:1"
      ? "aspect-square max-h-[340px]"
      : canvasRatio === "4:5"
      ? "aspect-[4/5] max-h-[360px]"
      : "aspect-[16/9] w-full max-h-[360px]";

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full bg-gray-950 border border-gray-800 rounded-xl overflow-hidden shadow-2xl text-xs font-marathi"
    >
      {/* Monitor Header */}
      <div className="bg-gray-900/90 px-3 py-1.5 border-b border-gray-800 flex items-center justify-between text-gray-300">
        <span className="font-bold text-[11px] text-red-500 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
          <span>प्रोग्रॅम मॉनिटर (Program Monitor)</span>
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 font-mono bg-black px-1.5 py-0.5 rounded border border-gray-800">
            {canvasRatio}
          </span>
          <span className="font-mono text-[11px] text-yellow-400 font-bold">
            {formatTimecode(currentTime)}
          </span>
        </div>
      </div>

      {/* Screen Viewport with Responsive Canvas Scaling */}
      <div className="flex-1 bg-black flex items-center justify-center p-2 relative overflow-hidden select-none">
        <div className={`relative bg-neutral-900 border border-neutral-800 overflow-hidden shadow-2xl ${aspectClass}`}>
          {/* Layer 1: Background Video / Image */}
          {activeClip ? (
            activeClip.mediaType === "image" ? (
              <img
                src={activeClip.assetUrl}
                alt=""
                className="w-full h-full object-cover transition-transform"
                style={{
                  opacity: activeClip.opacity,
                  transform: `scale(${activeClip.scale}) translate(${activeClip.positionX}%, ${activeClip.positionY}%)`,
                  filter: `brightness(${activeClip.brightness}%) contrast(${activeClip.contrast}%) saturate(${activeClip.saturation}%)`,
                }}
              />
            ) : (
              <video
                src={activeClip.assetUrl}
                autoPlay={isPlaying}
                muted
                className="w-full h-full object-cover"
                style={{
                  opacity: activeClip.opacity,
                }}
              />
            )
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-700 bg-radial from-gray-900 to-black p-4">
              <span className="text-[11px] font-bold text-gray-600">टाइमलाइनवर क्लिप टाका</span>
            </div>
          )}

          {/* Layer 2: Graphics Overlays (V3 / V4) */}
          <div className="absolute inset-0 pointer-events-none">
            {activeGraphics.map((graphic) => {
              const fontDef = NEWS_GRAPHIC_FONTS[graphic.fontKey] || NEWS_GRAPHIC_FONTS["tiro-press"];
              const isSelected = selectedGraphicId === graphic.id;

              return (
                <div
                  key={graphic.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectGraphic) onSelectGraphic(graphic.id);
                  }}
                  className={`pointer-events-auto transition-all ${
                    isSelected ? "ring-2 ring-yellow-400" : ""
                  }`}
                >
                  {renderProgramGraphic(graphic, fontDef.css, currentTime - graphic.startTime)}
                </div>
              );
            })}
          </div>

          {/* Safe Zones Guides Overlay */}
          {showSafeZones && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Action Safe (90%) */}
              <div className="absolute inset-[5%] border border-cyan-500/40 border-dashed" />
              {/* Title Safe (80%) */}
              <div className="absolute inset-[10%] border border-yellow-400/40" />
              <span className="absolute top-2 left-2 text-[8px] text-cyan-400/70 font-mono">
                Action / Title Safe
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Scrub Bar */}
      <div className="px-3 pt-2 bg-gray-900/60">
        <input
          type="range"
          min={0}
          max={duration || 60}
          step={0.1}
          value={currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
        />
        <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1 font-mono">
          <span>{formatTimecode(currentTime)}</span>
          <span>{formatTimecode(duration)}</span>
        </div>
      </div>

      {/* Program Transport Controls */}
      <div className="p-2 bg-gray-900 border-t border-gray-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onTogglePlay}
            className="p-1.5 bg-red-700 hover:bg-red-600 text-white rounded transition shadow-xs"
            title="Play / Pause (Space)"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
          </button>
          <button
            type="button"
            onClick={() => onSeek(0)}
            className="p-1.5 text-gray-400 hover:text-white rounded"
            title="सुरुवातीला जा"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 hidden sm:inline">
            Space: Play/Pause | S: Split
          </span>
          <button
            type="button"
            onClick={handleFullscreen}
            className="p-1 text-gray-400 hover:text-white rounded"
            title="फुलस्क्रीन"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function renderProgramGraphic(
  graphic: GraphicOverlayItem,
  fontCss: string,
  elapsedSec: number
) {
  switch (graphic.type) {
    case "running-ticker":
      return (
        <div
          className="absolute bottom-0 left-0 right-0 h-7 bg-red-900 text-white flex items-center overflow-hidden border-t-2 border-yellow-400 z-30"
          style={{ fontFamily: fontCss }}
        >
          <div className="bg-gray-950 text-yellow-400 px-2 py-1 text-[9px] font-black uppercase flex-shrink-0 z-10 shadow-md">
            ठळक घडामोडी
          </div>
          <div className="whitespace-nowrap animate-marquee flex items-center gap-8 text-[11px] font-bold px-4">
            <span>{graphic.title}</span>
            <span>★</span>
            <span>{graphic.title}</span>
          </div>
        </div>
      );

    case "lower-third":
      return (
        <div
          className="absolute bottom-10 left-4 bg-gray-950/95 border-l-4 border-red-700 p-2 shadow-2xl z-20 max-w-[85%]"
          style={{ fontFamily: fontCss }}
        >
          <div className="text-white font-black text-sm leading-tight">{graphic.title}</div>
          {graphic.subtitle && (
            <div className="text-gray-300 text-[10px] font-semibold mt-0.5">{graphic.subtitle}</div>
          )}
        </div>
      );

    case "location-tag":
      return (
        <div
          className="absolute top-4 left-4 bg-gray-950/90 text-white border-l-3 border-red-600 px-2.5 py-1 text-[11px] font-bold shadow-lg z-20"
          style={{ fontFamily: fontCss }}
        >
          {graphic.title}
        </div>
      );

    case "logo-watermark":
      return (
        <div
          className="absolute top-4 right-4 bg-red-900/90 text-white px-2.5 py-1 text-[10px] font-black tracking-wide shadow-lg z-20 rounded-xs"
          style={{ fontFamily: "'Rozha One', serif" }}
        >
          {graphic.title}
        </div>
      );

    case "breaking-bar":
      return (
        <div
          className="absolute bottom-9 left-2 right-2 bg-red-800 text-white p-2 border-y-2 border-yellow-400 shadow-2xl z-20"
          style={{ fontFamily: fontCss }}
        >
          <div className="text-[9px] font-black text-yellow-300 uppercase tracking-wider">
            🔴 तातडीचे वृत्त (BREAKING NEWS)
          </div>
          <div className="text-xs font-bold truncate mt-0.5">{graphic.title}</div>
        </div>
      );

    default:
      return null;
  }
}
