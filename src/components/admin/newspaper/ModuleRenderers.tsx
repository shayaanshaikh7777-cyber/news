"use client";

import React from "react";
import { NewspaperModuleConfig } from "@/types/newspaper";
import { getFontStyles } from "@/lib/newspaper/fonts";
import { MapPin, Quote, Clock, AlertTriangle, User, Calendar, Newspaper } from "lucide-react";

interface ModuleProps {
  module: NewspaperModuleConfig;
  isSelected?: boolean;
  onSelect?: () => void;
  readOnly?: boolean;
}

export function ModuleRenderer({ module, isSelected, onSelect, readOnly }: ModuleProps) {
  const selectionClass = !readOnly
    ? isSelected
      ? "ring-2 ring-red-700 bg-red-50/10 cursor-pointer transition-all"
      : "hover:outline hover:outline-1 hover:outline-dashed hover:outline-red-400 cursor-pointer transition-all"
    : "";

  return (
    <div
      onClick={!readOnly ? onSelect : undefined}
      className={`relative group ${selectionClass}`}
      style={{
        marginTop: `${module.style?.marginTop || 0}px`,
        marginBottom: `${module.style?.marginBottom || 0}px`,
      }}
    >
      {renderModuleContent(module)}
    </div>
  );
}

function renderModuleContent(module: NewspaperModuleConfig) {
  const style = module.style;
  const fontStyles = getFontStyles(
    style?.fontFamily,
    style?.fontSize,
    style?.customFontSizePx,
    style?.alignment,
    style?.fontWeight,
    style?.lineHeight
  );

  switch (module.type) {
    case "masthead":
      return (
        <div className="text-center py-4 border-b-2 border-red-900 bg-white">
          <div className="flex items-center justify-between text-[11px] text-gray-500 font-semibold px-2 mb-1 border-b border-gray-200 pb-1">
            <span>दैनिक वृत्तपत्र आवृत्ती</span>
            <span className="font-bold text-red-800">आवाज जामखेडचा डिजिटल न्यूजरूम</span>
            <span>अहिल्यानगर जिल्हा</span>
          </div>
          <h1
            className="text-4xl sm:text-5xl font-black text-red-900 tracking-tight leading-none"
            style={{ fontFamily: "'Rozha One', 'Tiro Devanagari Marathi', serif" }}
          >
            {module.title || "आवाज जामखेडचा"}
          </h1>
          {module.content && (
            <p className="text-xs text-gray-600 font-medium mt-1.5 font-sans tracking-wide">
              {module.content}
            </p>
          )}
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="h-[2px] bg-red-900 flex-1" />
            <span className="text-[10px] font-bold text-red-900 uppercase tracking-widest px-2">
              सत्यशोधक पत्रकारिता
            </span>
            <div className="h-[2px] bg-red-900 flex-1" />
          </div>
        </div>
      );

    case "dateline":
      return (
        <div className="bg-gray-100 border-y border-gray-300 py-1 px-3 flex items-center justify-between text-[11px] font-bold text-gray-800 my-2">
          <span>{module.title || "जामखेड दैनिक"}</span>
          <span className="text-gray-600">{module.content}</span>
          <span className="text-red-900">awaazjamkhed.com</span>
        </div>
      );

    case "section-label":
      return (
        <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-red-800">
          <span className="bg-red-800 text-white text-[10px] font-black px-2 py-0.5 rounded-xs uppercase tracking-wider">
            {module.title || "विशेष वृत्त"}
          </span>
          {module.locationTag && (
            <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-red-700" />
              <span>{module.locationTag}</span>
            </span>
          )}
        </div>
      );

    case "headline":
      return (
        <div className="my-2">
          {module.categoryName && (
            <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider block mb-0.5">
              {module.categoryName} {module.locationTag && `• ${module.locationTag}`}
            </span>
          )}
          <h2
            className="leading-tight text-gray-950 font-black"
            style={{
              ...fontStyles,
              color: style?.colorHex || "#111827",
            }}
          >
            {module.title || "बातमीचे ठळक शीर्षक"}
          </h2>
        </div>
      );

    case "subheadline":
      return (
        <h3
          className="my-1.5 text-red-900 font-bold leading-snug border-l-3 border-red-800 pl-2.5"
          style={fontStyles}
        >
          {module.title || "उपशीर्षक / बातमीचा गोषवारा"}
        </h3>
      );

    case "reporter-byline":
      return (
        <div className="flex items-center gap-2 text-xs font-bold text-gray-700 py-1 border-y border-gray-200 my-2">
          <User className="w-3.5 h-3.5 text-red-800" />
          <span>{module.title || "विशेष प्रतिनिधी, आवाज जामखेडचा"}</span>
          {module.content && <span className="text-gray-400 font-normal">| {module.content}</span>}
        </div>
      );

    case "hero-image":
    case "single-image":
      if (!module.image?.url) {
        return (
          <div className="w-full bg-gray-100 border-2 border-dashed border-gray-300 rounded p-6 text-center text-xs text-gray-400 my-2">
            छायाचित्र जोडण्यासाठी येथे क्लिक करा
          </div>
        );
      }
      return (
        <figure className="my-2 bg-gray-50 p-1 border border-gray-200">
          <img
            src={module.image.url}
            alt={module.image.altText || module.title || "वृत्त छायाचित्र"}
            className="w-full max-h-[360px] object-cover"
            style={{ objectPosition: module.image.focalPosition || "center" }}
          />
          {module.image.caption && (
            <figcaption className="text-[10px] text-gray-600 font-serif italic p-1.5 bg-gray-100 border-t border-gray-200 leading-snug">
              {module.image.caption}
            </figcaption>
          )}
        </figure>
      );

    case "image-grid-2":
      return (
        <div className="grid grid-cols-2 gap-2 my-2">
          {module.image?.url && (
            <figure className="bg-gray-50 border border-gray-200 p-1">
              <img src={module.image.url} alt="" className="w-full h-36 object-cover" />
              {module.image.caption && (
                <figcaption className="text-[9px] text-gray-600 p-1 truncate">
                  {module.image.caption}
                </figcaption>
              )}
            </figure>
          )}
          {module.secondaryImages?.[0]?.url && (
            <figure className="bg-gray-50 border border-gray-200 p-1">
              <img src={module.secondaryImages[0].url} alt="" className="w-full h-36 object-cover" />
              {module.secondaryImages[0].caption && (
                <figcaption className="text-[9px] text-gray-600 p-1 truncate">
                  {module.secondaryImages[0].caption}
                </figcaption>
              )}
            </figure>
          )}
        </div>
      );

    case "body-columns": {
      const colCount = style?.columnCount || 3;
      const cleanBody = (module.content || "").replace(/[#*`>]/g, "");

      return (
        <div className="my-2">
          {module.excerpt && (
            <p className="font-bold text-gray-900 mb-2 text-xs leading-relaxed border-l-2 border-red-800 pl-2">
              {module.title && <span className="text-red-900 mr-1">{module.title}</span>}
              {module.excerpt}
            </p>
          )}
          <div
            className="text-justify leading-relaxed text-gray-800"
            style={{
              ...fontStyles,
              columnCount: colCount,
              columnGap: "24px",
              columnRule: "1px solid #E5E7EB",
            }}
          >
            <p className="whitespace-pre-line">{cleanBody}</p>
          </div>
        </div>
      );
    }

    case "side-story":
      return (
        <div className="p-3 bg-[#FAF9F6] border border-gray-300 my-2">
          <div className="flex items-center justify-between text-[10px] font-bold text-red-900 border-b border-gray-200 pb-1 mb-1.5">
            <span>संक्षिप्त वृत्त</span>
            {module.locationTag && <span>📍 {module.locationTag}</span>}
          </div>
          {module.image?.url && (
            <img src={module.image.url} alt="" className="w-full h-24 object-cover mb-2 border border-gray-200" />
          )}
          <h4 className="font-bold text-gray-950 text-xs leading-snug mb-1">
            {module.title || "संक्षिप्त बातमी"}
          </h4>
          <p className="text-[11px] text-gray-700 leading-relaxed font-serif">
            {module.excerpt || module.content}
          </p>
        </div>
      );

    case "small-story":
      return (
        <div className="py-2 border-t border-gray-200 my-1">
          <h4 className="font-bold text-gray-900 text-xs leading-snug">
            {module.title}
          </h4>
          <p className="text-[11px] text-gray-600 leading-snug mt-0.5 line-clamp-3">
            {module.excerpt || module.content}
          </p>
        </div>
      );

    case "quote-box":
      return (
        <div className="my-2 p-3 bg-red-50/70 border-l-4 border-red-800 border-y border-r border-red-200">
          <div className="flex items-start gap-2">
            <Quote className="w-5 h-5 text-red-800 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-gray-900 italic leading-relaxed">
                "{module.quote?.text || module.content || "महत्त्वाचे विधान किंवा प्रतिक्रिया."}"
              </p>
              {module.quote?.speaker && (
                <p className="text-[10px] font-bold text-red-900 mt-1">
                  — {module.quote.speaker} {module.quote.designation && `(${module.quote.designation})`}
                </p>
              )}
            </div>
          </div>
        </div>
      );

    case "fact-box":
      return (
        <div className="my-2 p-3 bg-gray-50 border border-gray-300">
          <h4 className="text-[11px] font-bold text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-1 mb-2">
            {module.title || "महत्त्वाचे तपशील (Key Facts)"}
          </h4>
          <ul className="space-y-1 text-xs">
            {module.facts?.map((f, i) => (
              <li key={i} className="flex items-center justify-between text-gray-800 text-[11px]">
                <span className="font-semibold text-gray-600">{f.label}:</span>
                <span className="font-bold">{f.value}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case "breaking-strip":
      return (
        <div className="bg-red-800 text-white p-2.5 my-2 flex items-center gap-2 border-y-2 border-red-950">
          <span className="bg-yellow-400 text-gray-950 text-[10px] font-black px-2 py-0.5 uppercase tracking-wider">
            BREAKING
          </span>
          <p className="text-xs font-bold leading-tight truncate">
            {module.content || module.title}
          </p>
        </div>
      );

    case "timeline":
      return (
        <div className="p-3 bg-gray-50 border border-gray-300 my-2">
          <h4 className="text-[11px] font-bold text-red-900 flex items-center gap-1 mb-2 border-b border-gray-200 pb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{module.title || "घटनाक्रम (Timeline)"}</span>
          </h4>
          <div className="space-y-1.5">
            {module.timeline?.map((t, idx) => (
              <div key={idx} className="flex items-start gap-2 text-[11px]">
                <span className="font-bold text-red-800 bg-red-100 px-1.5 py-0.5 rounded text-[10px] flex-shrink-0">
                  {t.time}
                </span>
                <span className="text-gray-800 leading-snug">{t.event}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case "footer":
      return (
        <div className="mt-4 pt-2 border-t-2 border-gray-800 text-center text-[10px] text-gray-600 flex items-center justify-between">
          <span>{module.title || "आवाज जामखेडचा"}</span>
          <span>{module.content}</span>
        </div>
      );

    default:
      return (
        <div className="p-2 border border-gray-200 my-1 text-xs">
          <h4 className="font-bold">{module.title || module.type}</h4>
          <p className="text-gray-600 text-[11px]">{module.content}</p>
        </div>
      );
  }
}

