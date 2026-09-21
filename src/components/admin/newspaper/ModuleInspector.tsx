"use client";

import React from "react";
import { NewspaperModuleConfig, MarathiFontFamily, PresetFontSize, TextAlignment } from "@/types/newspaper";
import { MARATHI_FONTS, PRESET_FONT_SIZES, ALIGNMENT_LABELS } from "@/lib/newspaper/fonts";
import { Type, Columns, AlignLeft, AlignCenter, AlignRight, AlignJustify, Image as ImageIcon, Trash2, X } from "lucide-react";

interface InspectorProps {
  module: NewspaperModuleConfig | null;
  onUpdate: (updated: NewspaperModuleConfig) => void;
  onDelete: (moduleId: string) => void;
  onClose: () => void;
}

export function ModuleInspector({ module, onUpdate, onDelete, onClose }: InspectorProps) {
  if (!module) {
    return (
      <div className="p-5 text-center text-gray-400 text-xs font-medium">
        संपादित करण्यासाठी कॅनव्हासवरील कोणत्याही घटकावर (मॉड्यूलवर) क्लिक करा.
      </div>
    );
  }

  const style = module.style || {};

  const handleStyleChange = (key: keyof typeof style, val: any) => {
    onUpdate({
      ...module,
      style: {
        ...style,
        [key]: val,
      },
    });
  };

  return (
    <div className="p-4 space-y-5 text-xs text-gray-800">
      {/* Inspector Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div>
          <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">
            मॉड्यूल संपादन (Inspector)
          </span>
          <h3 className="font-bold text-gray-950 capitalize">{module.type.replace(/-/g, " ")}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 1. Content Editing */}
      <div className="space-y-3">
        <h4 className="font-bold text-gray-700 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
          <Type className="w-3.5 h-3.5 text-red-700" />
          <span>मजकूर संपादन (Content)</span>
        </h4>

        {/* Title / Headline */}
        {module.title !== undefined && (
          <div>
            <label className="block text-gray-600 mb-1 font-semibold">शीर्षक / मथळा:</label>
            <input
              type="text"
              value={module.title || ""}
              onChange={(e) => onUpdate({ ...module, title: e.target.value })}
              className="w-full border border-gray-300 rounded p-2 text-xs focus:ring-1 focus:ring-red-700 focus:outline-none"
            />
          </div>
        )}

        {/* Excerpt / Summary */}
        {module.excerpt !== undefined && (
          <div>
            <label className="block text-gray-600 mb-1 font-semibold">संक्षिप्त निष्कर्ष (Excerpt):</label>
            <textarea
              rows={2}
              value={module.excerpt || ""}
              onChange={(e) => onUpdate({ ...module, excerpt: e.target.value })}
              className="w-full border border-gray-300 rounded p-2 text-xs focus:ring-1 focus:ring-red-700 focus:outline-none leading-relaxed"
            />
          </div>
        )}

        {/* Main Body Content */}
        {module.content !== undefined && (
          <div>
            <label className="block text-gray-600 mb-1 font-semibold">सविस्तर मजकूर (Body Text):</label>
            <textarea
              rows={5}
              value={module.content || ""}
              onChange={(e) => onUpdate({ ...module, content: e.target.value })}
              className="w-full border border-gray-300 rounded p-2 text-xs focus:ring-1 focus:ring-red-700 focus:outline-none leading-relaxed"
            />
          </div>
        )}

        {/* Quote Specifics */}
        {module.quote && (
          <div className="space-y-2 p-2.5 bg-gray-50 rounded border border-gray-200">
            <div>
              <label className="block text-gray-600 mb-1 font-semibold">अवतरण (Quote):</label>
              <textarea
                rows={2}
                value={module.quote.text}
                onChange={(e) =>
                  onUpdate({
                    ...module,
                    quote: { ...module.quote!, text: e.target.value },
                  })
                }
                className="w-full border border-gray-300 rounded p-1.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1 font-semibold">व्यक्तीचे नाव (Speaker):</label>
              <input
                type="text"
                value={module.quote.speaker}
                onChange={(e) =>
                  onUpdate({
                    ...module,
                    quote: { ...module.quote!, speaker: e.target.value },
                  })
                }
                className="w-full border border-gray-300 rounded p-1.5 text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Image Controls */}
      {module.image && (
        <div className="space-y-3 pt-3 border-t border-gray-200">
          <h4 className="font-bold text-gray-700 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
            <ImageIcon className="w-3.5 h-3.5 text-red-700" />
            <span>छायाचित्र पर्याय (Image Options)</span>
          </h4>

          <div>
            <label className="block text-gray-600 mb-1 font-semibold">इमेज URL:</label>
            <input
              type="url"
              value={module.image.url || ""}
              onChange={(e) =>
                onUpdate({
                  ...module,
                  image: { ...module.image!, url: e.target.value },
                })
              }
              className="w-full border border-gray-300 rounded p-1.5 text-xs"
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1 font-semibold">फोटो कॅप्शन (Caption):</label>
            <input
              type="text"
              value={module.image.caption || ""}
              onChange={(e) =>
                onUpdate({
                  ...module,
                  image: { ...module.image!, caption: e.target.value },
                })
              }
              placeholder="छायाचित्र वर्णन किंवा फोटो सौजन्य..."
              className="w-full border border-gray-300 rounded p-1.5 text-xs font-serif"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-gray-600 mb-1 font-semibold">Object Fit:</label>
              <select
                value={module.image.objectFit || "cover"}
                onChange={(e) =>
                  onUpdate({
                    ...module,
                    image: { ...module.image!, objectFit: e.target.value as any },
                  })
                }
                className="w-full border border-gray-300 rounded p-1 text-xs"
              >
                <option value="cover">Cover (पूर्ण भरा)</option>
                <option value="contain">Contain (मूळ आकार)</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-600 mb-1 font-semibold">फोकस जागा:</label>
              <select
                value={module.image.focalPosition || "center"}
                onChange={(e) =>
                  onUpdate({
                    ...module,
                    image: { ...module.image!, focalPosition: e.target.value as any },
                  })
                }
                className="w-full border border-gray-300 rounded p-1 text-xs"
              >
                <option value="center">Center</option>
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 3. Typography & Styling Controls */}
      <div className="space-y-3 pt-3 border-t border-gray-200">
        <h4 className="font-bold text-gray-700 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
          <Type className="w-3.5 h-3.5 text-red-700" />
          <span>फॉन्ट व मांडणी (Typography)</span>
        </h4>

        {/* Font Family */}
        <div>
          <label className="block text-gray-600 mb-1 font-semibold">मराठी वृत्तपत्र फॉन्ट:</label>
          <select
            value={style.fontFamily || "tiro-press"}
            onChange={(e) => handleStyleChange("fontFamily", e.target.value as MarathiFontFamily)}
            className="w-full border border-gray-300 rounded p-1.5 text-xs font-semibold"
          >
            {Object.values(MARATHI_FONTS).map((f) => (
              <option key={f.id} value={f.id}>
                {f.nameMarathi}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size Preset */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-gray-600 mb-1 font-semibold">फॉन्ट आकार:</label>
            <select
              value={style.fontSize || "normal"}
              onChange={(e) => handleStyleChange("fontSize", e.target.value as PresetFontSize)}
              className="w-full border border-gray-300 rounded p-1.5 text-xs"
            >
              {Object.entries(PRESET_FONT_SIZES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          {/* Alignment */}
          <div>
            <label className="block text-gray-600 mb-1 font-semibold">अलाइनमेंट:</label>
            <div className="flex items-center gap-1 border border-gray-300 rounded p-1 bg-white">
              <button
                type="button"
                onClick={() => handleStyleChange("alignment", "left")}
                className={`flex-1 p-1 rounded ${style.alignment === "left" ? "bg-red-800 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                title={ALIGNMENT_LABELS.left}
              >
                <AlignLeft className="w-3.5 h-3.5 mx-auto" />
              </button>
              <button
                type="button"
                onClick={() => handleStyleChange("alignment", "center")}
                className={`flex-1 p-1 rounded ${style.alignment === "center" ? "bg-red-800 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                title={ALIGNMENT_LABELS.center}
              >
                <AlignCenter className="w-3.5 h-3.5 mx-auto" />
              </button>
              <button
                type="button"
                onClick={() => handleStyleChange("alignment", "right")}
                className={`flex-1 p-1 rounded ${style.alignment === "right" ? "bg-red-800 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                title={ALIGNMENT_LABELS.right}
              >
                <AlignRight className="w-3.5 h-3.5 mx-auto" />
              </button>
              <button
                type="button"
                onClick={() => handleStyleChange("alignment", "justify")}
                className={`flex-1 p-1 rounded ${style.alignment === "justify" || !style.alignment ? "bg-red-800 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                title={ALIGNMENT_LABELS.justify}
              >
                <AlignJustify className="w-3.5 h-3.5 mx-auto" />
              </button>
            </div>
          </div>
        </div>

        {/* Columns Count (for body-columns) */}
        {module.type === "body-columns" && (
          <div>
            <label className="block text-gray-600 mb-1 font-semibold flex items-center gap-1">
              <Columns className="w-3.5 h-3.5 text-red-700" />
              <span>कॉलम संख्या (Newspaper Columns):</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleStyleChange("columnCount", c)}
                  className={`flex-1 py-1.5 rounded font-bold border ${
                    (style.columnCount || 3) === c
                      ? "bg-red-800 text-white border-red-800"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {c} कॉलम
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Module Action */}
      <div className="pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => onDelete(module.id)}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-red-300 rounded text-red-700 font-bold hover:bg-red-50 text-xs transition shadow-xs"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>हे मॉड्यूल पानातून हटवा</span>
        </button>
      </div>
    </div>
  );
}

