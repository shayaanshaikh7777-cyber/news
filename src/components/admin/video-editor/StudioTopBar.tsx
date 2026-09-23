"use client";

import React from "react";
import { CanvasRatio, CANVAS_PRESETS } from "@/types/video-studio";
import {
  Save,
  Undo,
  Redo,
  Download,
  Columns,
  Square,
  Shield,
  Loader2,
  Film,
  CheckCircle2,
} from "lucide-react";

interface TopBarProps {
  projectTitle: string;
  onChangeTitle: (title: string) => void;
  canvasRatio: CanvasRatio;
  onChangeRatio: (ratio: CanvasRatio) => void;
  isDualMonitor: boolean;
  onToggleDualMonitor: () => void;
  showSafeZones: boolean;
  onToggleSafeZones: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  isSaving: boolean;
  saveMessage: string;
  onExport: () => void;
  isExporting: boolean;
}

export function StudioTopBar({
  projectTitle,
  onChangeTitle,
  canvasRatio,
  onChangeRatio,
  isDualMonitor,
  onToggleDualMonitor,
  showSafeZones,
  onToggleSafeZones,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  isSaving,
  saveMessage,
  onExport,
  isExporting,
}: TopBarProps) {
  return (
    <header className="no-print bg-gray-950 text-gray-100 border-b border-gray-800 px-4 py-2 flex items-center justify-between gap-4 z-20 text-xs font-marathi">
      {/* 1. Left: Brand & Project Name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-red-500 font-black">
          <Film className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span className="hidden sm:inline font-headline text-sm tracking-wide text-white">
            व्हिडिओ स्टुडिओ
          </span>
        </div>

        <div className="h-4 w-[1px] bg-gray-800" />

        <input
          type="text"
          value={projectTitle}
          onChange={(e) => onChangeTitle(e.target.value)}
          placeholder="प्रकल्पाचे नाव..."
          className="bg-transparent hover:bg-gray-900 focus:bg-gray-900 border border-transparent hover:border-gray-700 focus:border-red-700 rounded px-2 py-1 text-xs font-bold text-gray-100 focus:outline-none transition w-48 sm:w-72 truncate"
        />
      </div>

      {/* 2. Center: Canvas Ratio & Monitor Controls */}
      <div className="flex items-center gap-2">
        {/* Canvas Ratio Buttons */}
        <div className="flex items-center bg-gray-900 rounded-lg p-0.5 border border-gray-800">
          {(["16:9", "9:16", "1:1", "4:5"] as CanvasRatio[]).map((r) => {
            const isActive = canvasRatio === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => onChangeRatio(r)}
                className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                  isActive
                    ? "bg-red-800 text-white shadow-xs"
                    : "text-gray-400 hover:text-gray-200"
                }`}
                title={CANVAS_PRESETS[r].label}
              >
                {r}
              </button>
            );
          })}
        </div>

        <div className="h-4 w-[1px] bg-gray-800 hidden md:block" />

        {/* Dual / Single View Toggle */}
        <button
          type="button"
          onClick={onToggleDualMonitor}
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition ${
            isDualMonitor
              ? "bg-gray-800 text-yellow-400 border-yellow-500/40"
              : "border-gray-800 text-gray-400 hover:bg-gray-900"
          }`}
          title="Dual Screen: Source Monitor + Program Monitor"
        >
          <Columns className="w-3.5 h-3.5" />
          <span>{isDualMonitor ? "ड्युअल स्क्रीन (ON)" : "सिंगल स्क्रीन"}</span>
        </button>

        {/* Safe Zones Toggle */}
        <button
          type="button"
          onClick={onToggleSafeZones}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold transition ${
            showSafeZones
              ? "bg-gray-800 text-cyan-400 border-cyan-500/40"
              : "border-gray-800 text-gray-400 hover:bg-gray-900"
          }`}
          title="Title / Action Safe Zones"
        >
          <Shield className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Safe Zone</span>
        </button>
      </div>

      {/* 3. Right: Undo/Redo, Save & Export */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-900 rounded disabled:opacity-30"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-900 rounded disabled:opacity-30"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo className="w-4 h-4" />
        </button>

        {saveMessage && (
          <span className="text-[11px] text-emerald-400 font-bold hidden sm:inline">
            {saveMessage}
          </span>
        )}

        {/* Save Button */}
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-200 font-bold px-3 py-1.5 rounded-lg text-xs transition disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-red-500" />}
          <span className="hidden sm:inline">सेव्ह करा</span>
        </button>

        {/* Export Button */}
        <button
          type="button"
          onClick={onExport}
          disabled={isExporting}
          className="flex items-center gap-1.5 bg-red-700 hover:bg-red-600 text-white font-black px-3.5 py-1.5 rounded-lg text-xs shadow transition disabled:opacity-50"
        >
          {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          <span>एक्सपोर्ट (MP4)</span>
        </button>
      </div>
    </header>
  );
}
