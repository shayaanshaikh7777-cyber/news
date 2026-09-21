"use client";

import React, { useState } from "react";
import { ArticleSummaryItem, NewspaperTemplateId } from "@/types/newspaper";
import { NEWSPAPER_TEMPLATES } from "@/lib/newspaper/templates";
import { Search, Sparkles, Plus, CheckSquare, Square, Newspaper, LayoutGrid, Loader2 } from "lucide-react";

interface ArticleSelectorProps {
  articles: ArticleSummaryItem[];
  selectedArticleIds: string[];
  onToggleSelectArticle: (articleId: string) => void;
  onApplyTemplate: (templateId: NewspaperTemplateId) => void;
  onRunAILayout: () => void;
  isAiLoading: boolean;
  currentTemplateId: NewspaperTemplateId;
}

export function ArticleSelectorDrawer({
  articles,
  selectedArticleIds,
  onToggleSelectArticle,
  onApplyTemplate,
  onRunAILayout,
  isAiLoading,
  currentTemplateId,
}: ArticleSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"articles" | "templates">("articles");

  const filteredArticles = articles.filter(
    (a) =>
      a.headline.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.locationName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 text-xs">
      {/* Tab Switcher: Articles vs Templates */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          type="button"
          onClick={() => setActiveTab("articles")}
          className={`flex-1 py-2.5 px-3 text-center font-bold flex items-center justify-center gap-1.5 border-b-2 ${
            activeTab === "articles"
              ? "border-red-800 text-red-900 bg-white"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Newspaper className="w-3.5 h-3.5" />
          <span>बातम्या निवडा ({selectedArticleIds.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("templates")}
          className={`flex-1 py-2.5 px-3 text-center font-bold flex items-center justify-center gap-1.5 border-b-2 ${
            activeTab === "templates"
              ? "border-red-800 text-red-900 bg-white"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>टेम्पलेट्स</span>
        </button>
      </div>

      {/* Tab 1: Articles Selection */}
      {activeTab === "articles" && (
        <div className="flex flex-col flex-1 min-h-0">
          {/* AI Layout Suggestion Trigger */}
          <div className="p-3 bg-gradient-to-r from-red-900 to-amber-900 text-white flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1 text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>AI वृत्त रचना (AI Layout)</span>
              </span>
              <span className="text-[10px] text-yellow-200">
                {selectedArticleIds.length} निवडलेल्या
              </span>
            </div>
            <button
              type="button"
              onClick={onRunAILayout}
              disabled={isAiLoading || selectedArticleIds.length === 0}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-gray-950 font-black py-2 rounded-lg text-xs shadow transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isAiLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>AI रचना सुचवत आहे...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI लेआउट तयार करा</span>
                </>
              )}
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-2.5 border-b border-gray-200">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="बातमी किंवा स्थान शोधा..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-red-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Article List Scrollable */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 p-1">
            {filteredArticles.map((art) => {
              const isSelected = selectedArticleIds.includes(art.id);

              return (
                <div
                  key={art.id}
                  onClick={() => onToggleSelectArticle(art.id)}
                  className={`p-2.5 flex items-start gap-2.5 rounded cursor-pointer transition-colors ${
                    isSelected ? "bg-red-50/80 border border-red-200" : "hover:bg-gray-50"
                  }`}
                >
                  <button type="button" className="mt-0.5 text-red-800 flex-shrink-0">
                    {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-gray-400" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-0.5">
                      <span className="font-bold text-red-800">{art.categoryName}</span>
                      <span>•</span>
                      <span>📍 {art.locationName}</span>
                    </div>
                    <h5 className="font-bold text-gray-900 text-xs leading-snug line-clamp-2">
                      {art.headline}
                    </h5>
                    {art.featuredImage && (
                      <span className="text-[9px] text-emerald-700 font-semibold mt-0.5 block">
                        📷 फोटो उपलब्ध
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Template Selection */}
      {activeTab === "templates" && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          <p className="text-[11px] text-gray-500 font-medium">
            वर्तमानपत्राच्या पानासाठी संपादकीय साचा (Template) निवडा:
          </p>

          {Object.values(NEWSPAPER_TEMPLATES).map((tmpl) => {
            const isCurrent = currentTemplateId === tmpl.id;

            return (
              <div
                key={tmpl.id}
                onClick={() => onApplyTemplate(tmpl.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  isCurrent
                    ? "border-red-800 bg-red-50/50 shadow-xs ring-1 ring-red-700"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-gray-950 text-xs">{tmpl.nameMarathi}</h4>
                  <span className="text-[9px] bg-red-100 text-red-900 font-bold px-1.5 py-0.5 rounded">
                    {tmpl.badge}
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed font-sans">{tmpl.description}</p>
                <div className="mt-2 text-[10px] text-gray-400 font-medium">
                  शिफारस: {tmpl.recommendedStoryCount} बातम्या
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

