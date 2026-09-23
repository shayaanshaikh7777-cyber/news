"use client";

import React from "react";
import {
  VideoClipItem,
  GraphicOverlayItem,
  AudioClipItem,
  CanvasRatio,
  CANVAS_PRESETS,
  NewsFontKey,
} from "@/types/video-studio";
import { NEWS_GRAPHIC_FONTS } from "@/lib/video-editor/graphics";
import {
  Sliders,
  Type,
  Video,
  Volume2,
  Trash2,
  Sparkles,
  Layers,
  Settings,
  Clock,
  Palette,
  Eye,
} from "lucide-react";

interface InspectorPanelProps {
  // Selection
  selectedId: string | null;
  selectedType: "clip" | "graphic" | "audio" | null;
  // Selected Objects
  selectedClip?: VideoClipItem;
  selectedGraphic?: GraphicOverlayItem;
  selectedAudio?: AudioClipItem;
  // Project settings
  projectTitle: string;
  projectRatio: CanvasRatio;
  projectDuration: number;
  // Callbacks
  onUpdateTitle: (title: string) => void;
  onUpdateRatio: (ratio: CanvasRatio) => void;
  onUpdateDuration: (duration: number) => void;
  onUpdateClip: (id: string, updates: Partial<VideoClipItem>) => void;
  onUpdateGraphic: (id: string, updates: Partial<GraphicOverlayItem>) => void;
  onUpdateAudio: (id: string, updates: Partial<AudioClipItem>) => void;
  onDeleteItem: (id: string, type: "clip" | "graphic" | "audio") => void;
}

export default function InspectorPanel({
  selectedId,
  selectedType,
  selectedClip,
  selectedGraphic,
  selectedAudio,
  projectTitle,
  projectRatio,
  projectDuration,
  onUpdateTitle,
  onUpdateRatio,
  onUpdateDuration,
  onUpdateClip,
  onUpdateGraphic,
  onUpdateAudio,
  onDeleteItem,
}: InspectorPanelProps) {
  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-800 text-gray-200 w-80 flex-shrink-0">
      {/* Header */}
      <div className="h-10 px-3 border-b border-gray-800 bg-gray-950 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-xs text-gray-200">
          <Sliders className="w-3.5 h-3.5 text-red-500" />
          <span>
            {selectedType === "clip"
              ? "व्हिडिओ दृश्य गुणधर्म"
              : selectedType === "graphic"
              ? "ग्राफिक व फॉन्ट सेटिंग्ज"
              : selectedType === "audio"
              ? "ऑडिओ व व्हॉइस नियंत्रण"
              : "प्रकल्प सेटिंग्ज (Project)"}
          </span>
        </div>

        {selectedId && selectedType && (
          <button
            onClick={() => onDeleteItem(selectedId, selectedType)}
            className="p-1 rounded hover:bg-red-950 text-red-400 hover:text-red-200 transition"
            title="हटवा"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-3 text-xs space-y-4">
        {/* 1. VIDEO CLIP INSPECTOR */}
        {selectedType === "clip" && selectedClip && (
          <div className="space-y-3.5">
            <div>
              <label className="text-[11px] text-gray-400 block mb-1">दृश्याचे शीर्षक:</label>
              <input
                type="text"
                value={selectedClip.title}
                onChange={(e) => onUpdateClip(selectedClip.id, { title: e.target.value })}
                className="w-full bg-gray-950 border border-gray-700 rounded px-2.5 py-1.5 text-gray-100 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">सुरुवात (Sec):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={Number(selectedClip.startTime.toFixed(1))}
                  onChange={(e) => onUpdateClip(selectedClip.id, { startTime: Number(e.target.value) })}
                  className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-1 text-gray-100"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">कालावधी (Sec):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.3"
                  value={Number(selectedClip.duration.toFixed(1))}
                  onChange={(e) => onUpdateClip(selectedClip.id, { duration: Number(e.target.value) })}
                  className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-1 text-gray-100"
                />
              </div>
            </div>

            {/* Track Switcher */}
            <div>
              <label className="text-[11px] text-gray-400 block mb-1">ट्रॅक:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onUpdateClip(selectedClip.id, { trackId: "V1" })}
                  className={`py-1 rounded font-bold border transition ${
                    selectedClip.trackId === "V1"
                      ? "bg-red-800 text-white border-red-600"
                      : "bg-gray-800 text-gray-400 border-gray-700 hover:text-white"
                  }`}
                >
                  V1 (मुख्य दृश्य)
                </button>
                <button
                  onClick={() => onUpdateClip(selectedClip.id, { trackId: "V2" })}
                  className={`py-1 rounded font-bold border transition ${
                    selectedClip.trackId === "V2"
                      ? "bg-orange-800 text-white border-orange-600"
                      : "bg-gray-800 text-gray-400 border-gray-700 hover:text-white"
                  }`}
                >
                  V2 (बी-रोल)
                </button>
              </div>
            </div>

            {/* Transform Controls */}
            <div className="p-2.5 bg-gray-950 rounded border border-gray-800 space-y-2.5">
              <span className="font-semibold text-gray-300 block">स्केल व पारदर्शकता (Transform)</span>

              <div>
                <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                  <span>झूम / आकार (Scale):</span>
                  <span>{Math.round(selectedClip.scale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2"
                  step="0.05"
                  value={selectedClip.scale}
                  onChange={(e) => onUpdateClip(selectedClip.id, { scale: Number(e.target.value) })}
                  className="w-full h-1 bg-gray-700 rounded accent-red-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                  <span>पारदर्शकता (Opacity):</span>
                  <span>{Math.round(selectedClip.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={selectedClip.opacity}
                  onChange={(e) => onUpdateClip(selectedClip.id, { opacity: Number(e.target.value) })}
                  className="w-full h-1 bg-gray-700 rounded accent-red-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                  <span>आवाज (Audio Volume):</span>
                  <span>{selectedClip.mute ? "बंद (Muted)" : `${selectedClip.volume}%`}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedClip.mute ? 0 : selectedClip.volume}
                  onChange={(e) =>
                    onUpdateClip(selectedClip.id, { volume: Number(e.target.value), mute: false })
                  }
                  className="w-full h-1 bg-gray-700 rounded accent-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. GRAPHIC OVERLAY INSPECTOR */}
        {selectedType === "graphic" && selectedGraphic && (
          <div className="space-y-3.5">
            <div>
              <label className="text-[11px] text-gray-400 block mb-1">मुख्य मथळा / नाव (Title):</label>
              <textarea
                rows={2}
                value={selectedGraphic.title}
                onChange={(e) => onUpdateGraphic(selectedGraphic.id, { title: e.target.value })}
                className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-gray-100 font-headline font-bold focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-gray-400 block mb-1">उपमथळा / पदनाम (Subtitle):</label>
              <input
                type="text"
                value={selectedGraphic.subtitle || ""}
                onChange={(e) => onUpdateGraphic(selectedGraphic.id, { subtitle: e.target.value })}
                placeholder="उदा. विशेष प्रतिनिधी, जामखेड"
                className="w-full bg-gray-950 border border-gray-700 rounded px-2.5 py-1.5 text-gray-100 focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Typography */}
            <div className="p-2.5 bg-gray-950 rounded border border-gray-800 space-y-2.5">
              <span className="font-semibold text-gray-300 block">मराठी वृत्त फॉन्ट (Typography)</span>

              <div>
                <label className="text-[11px] text-gray-400 block mb-1">फॉन्ट निवडा:</label>
                <select
                  value={selectedGraphic.fontKey}
                  onChange={(e) =>
                    onUpdateGraphic(selectedGraphic.id, { fontKey: e.target.value as NewsFontKey })
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-200"
                >
                  {Object.entries(NEWS_GRAPHIC_FONTS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">फॉन्ट आकार (px):</label>
                  <input
                    type="number"
                    min="10"
                    max="80"
                    value={selectedGraphic.fontSize}
                    onChange={(e) => onUpdateGraphic(selectedGraphic.id, { fontSize: Number(e.target.value) })}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-gray-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">जाडी (Weight):</label>
                  <select
                    value={selectedGraphic.fontWeight}
                    onChange={(e) =>
                      onUpdateGraphic(selectedGraphic.id, {
                        fontWeight: e.target.value as "bold" | "black" | "normal",
                      })
                    }
                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-gray-100"
                  >
                    <option value="black">Black (ठळक)</option>
                    <option value="bold">Bold</option>
                    <option value="normal">Normal</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="p-2.5 bg-gray-950 rounded border border-gray-800 space-y-2">
              <span className="font-semibold text-gray-300 block">रंगसंगती (Theme Colors)</span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">बॅकग्राउंड:</label>
                  <input
                    type="text"
                    value={selectedGraphic.bgColor}
                    onChange={(e) => onUpdateGraphic(selectedGraphic.id, { bgColor: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-1.5 py-1 text-[10px] text-gray-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">अक्षर रंग:</label>
                  <input
                    type="text"
                    value={selectedGraphic.textColor}
                    onChange={(e) => onUpdateGraphic(selectedGraphic.id, { textColor: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-1.5 py-1 text-[10px] text-gray-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">हायलाइट:</label>
                  <input
                    type="text"
                    value={selectedGraphic.accentColor}
                    onChange={(e) => onUpdateGraphic(selectedGraphic.id, { accentColor: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-1.5 py-1 text-[10px] text-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Timing */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">सुरुवात (Sec):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={Number(selectedGraphic.startTime.toFixed(1))}
                  onChange={(e) => onUpdateGraphic(selectedGraphic.id, { startTime: Number(e.target.value) })}
                  className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-1 text-gray-100"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">कालावधी (Sec):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  value={Number(selectedGraphic.duration.toFixed(1))}
                  onChange={(e) => onUpdateGraphic(selectedGraphic.id, { duration: Number(e.target.value) })}
                  className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-1 text-gray-100"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. AUDIO CLIP INSPECTOR */}
        {selectedType === "audio" && selectedAudio && (
          <div className="space-y-3.5">
            <div>
              <label className="text-[11px] text-gray-400 block mb-1">ऑडिओ शीर्षक:</label>
              <input
                type="text"
                value={selectedAudio.title}
                onChange={(e) => onUpdateAudio(selectedAudio.id, { title: e.target.value })}
                className="w-full bg-gray-950 border border-gray-700 rounded px-2.5 py-1.5 text-gray-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">सुरुवात (Sec):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={Number(selectedAudio.startTime.toFixed(1))}
                  onChange={(e) => onUpdateAudio(selectedAudio.id, { startTime: Number(e.target.value) })}
                  className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-1 text-gray-100"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">कालावधी (Sec):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.3"
                  value={Number(selectedAudio.duration.toFixed(1))}
                  onChange={(e) => onUpdateAudio(selectedAudio.id, { duration: Number(e.target.value) })}
                  className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-1 text-gray-100"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                <span>आवाज व्हॉल्यूम:</span>
                <span>{selectedAudio.mute ? "म्यूट" : `${selectedAudio.volume}%`}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedAudio.mute ? 0 : selectedAudio.volume}
                onChange={(e) => onUpdateAudio(selectedAudio.id, { volume: Number(e.target.value), mute: false })}
                className="w-full h-1 bg-gray-700 rounded accent-blue-500"
              />
            </div>
          </div>
        )}

        {/* 4. GLOBAL PROJECT SETTINGS (When nothing selected) */}
        {!selectedId && (
          <div className="space-y-4">
            <div>
              <label className="text-[11px] text-gray-400 block mb-1">व्हिडिओ प्रकल्पाचे नाव:</label>
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => onUpdateTitle(e.target.value)}
                className="w-full bg-gray-950 border border-gray-700 rounded px-2.5 py-1.5 text-gray-100 font-semibold focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-gray-400 block mb-1">कॅनव्हास प्रमाण (Aspect Ratio):</label>
              <div className="grid grid-cols-2 gap-2">
                {(["16:9", "9:16", "1:1", "4:5"] as CanvasRatio[]).map((r) => {
                  const preset = CANVAS_PRESETS[r];
                  const isCur = projectRatio === r;

                  return (
                    <button
                      key={r}
                      onClick={() => onUpdateRatio(r)}
                      className={`p-2 rounded text-left border transition flex flex-col gap-0.5 ${
                        isCur
                          ? "bg-red-950 border-red-600 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500"
                      }`}
                    >
                      <span className="font-bold text-xs">{r}</span>
                      <span className="text-[10px] text-gray-400 truncate">{preset.label.split("(")[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[11px] text-gray-400 block mb-1">एकूण कालावधी (सेकंद):</label>
              <input
                type="number"
                min="10"
                max="600"
                value={projectDuration}
                onChange={(e) => onUpdateDuration(Math.max(10, Number(e.target.value)))}
                className="w-full bg-gray-950 border border-gray-700 rounded px-2.5 py-1.5 text-gray-100 font-mono"
              />
            </div>

            <div className="p-3 bg-gray-950 rounded border border-gray-800 text-[11px] text-gray-400 space-y-1">
              <span className="font-bold text-gray-200 block mb-1">संपादक कीबोर्ड शॉर्टकट:</span>
              <div>• <kbd className="bg-gray-800 px-1 py-0.5 rounded text-gray-200 font-mono">Space</kbd> : प्ले / पॉज</div>
              <div>• <kbd className="bg-gray-800 px-1 py-0.5 rounded text-gray-200 font-mono">S</kbd> : प्लेहेडवर कट (Split)</div>
              <div>• <kbd className="bg-gray-800 px-1 py-0.5 rounded text-gray-200 font-mono">Delete</kbd> : निवडलेला घटक हटवा</div>
              <div>• <kbd className="bg-gray-800 px-1 py-0.5 rounded text-gray-200 font-mono">Home</kbd> : टाइमलाइन सुरुवातीला</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
