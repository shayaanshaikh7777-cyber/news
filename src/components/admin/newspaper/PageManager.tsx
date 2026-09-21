"use client";

import React from "react";
import { NewspaperPage, NewspaperTemplateId } from "@/types/newspaper";
import { NEWSPAPER_TEMPLATES } from "@/lib/newspaper/templates";
import { Plus, Copy, Trash2, ChevronLeft, ChevronRight, FileText } from "lucide-react";

interface PageManagerProps {
  pages: NewspaperPage[];
  activePageIndex: number;
  onSelectPage: (index: number) => void;
  onAddPage: () => void;
  onDuplicatePage: (index: number) => void;
  onDeletePage: (index: number) => void;
  onMovePage: (fromIndex: number, toIndex: number) => void;
}

export function PageManager({
  pages,
  activePageIndex,
  onSelectPage,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
  onMovePage,
}: PageManagerProps) {
  return (
    <div className="bg-white border-t border-gray-200 p-2.5 flex items-center justify-between gap-4 overflow-x-auto text-xs">
      {/* Page Thumbnails Strip */}
      <div className="flex items-center gap-2 overflow-x-auto flex-1 py-1">
        {pages.map((page, idx) => {
          const isActive = activePageIndex === idx;
          const templateName = NEWSPAPER_TEMPLATES[page.templateId]?.nameMarathi || page.templateId;

          return (
            <div
              key={page.id}
              onClick={() => onSelectPage(idx)}
              className={`flex-shrink-0 w-32 p-2 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                isActive
                  ? "border-red-800 bg-red-50/60 shadow-xs ring-1 ring-red-700"
                  : "border-gray-200 bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-gray-900 text-xs">पान {idx + 1}</span>
                <span className="text-[10px] text-gray-500">
                  {page.modules.length} घटक
                </span>
              </div>
              <p className="text-[10px] text-gray-600 truncate">{templateName}</p>

              {/* Action Buttons for Active Page */}
              {isActive && pages.length > 1 && (
                <div className="flex items-center justify-end gap-1 mt-1.5 pt-1 border-t border-red-200">
                  {idx > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMovePage(idx, idx - 1);
                      }}
                      className="p-0.5 text-gray-500 hover:text-gray-900"
                      title="डावीकडे हलवा"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                  )}
                  {idx < pages.length - 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMovePage(idx, idx + 1);
                      }}
                      className="p-0.5 text-gray-500 hover:text-gray-900"
                      title="उजवीकडे हलवा"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicatePage(idx);
                    }}
                    className="p-0.5 text-gray-500 hover:text-gray-900"
                    title="पानाची प्रत बनवा"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePage(idx);
                    }}
                    className="p-0.5 text-red-700 hover:text-red-900"
                    title="पान हटवा"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Add Page Button */}
        <button
          type="button"
          onClick={onAddPage}
          className="flex-shrink-0 w-28 h-16 rounded-lg border-2 border-dashed border-gray-300 hover:border-red-700 hover:bg-red-50/50 flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-red-800 transition font-bold"
        >
          <Plus className="w-4 h-4" />
          <span className="text-[11px]">+ नवीन पान</span>
        </button>
      </div>
    </div>
  );
}

