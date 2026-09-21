"use client";

import React, { useState, useRef } from "react";
import { NewspaperPage, PAGE_DIMENSIONS } from "@/types/newspaper";
import { ModuleRenderer } from "./ModuleRenderers";
import { GOOGLE_FONTS_NEWSPAPER_URL } from "@/lib/newspaper/fonts";
import { ZoomIn, ZoomOut, Maximize2, MoveUp, MoveDown, Trash2 } from "lucide-react";

interface CanvasProps {
  page: NewspaperPage;
  selectedModuleId?: string | null;
  onSelectModule: (moduleId: string) => void;
  onMoveModule: (moduleId: string, direction: "up" | "down") => void;
  onDeleteModule: (moduleId: string) => void;
  readOnly?: boolean;
}

export function NewspaperCanvas({
  page,
  selectedModuleId,
  onSelectModule,
  onMoveModule,
  onDeleteModule,
  readOnly = false,
}: CanvasProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const dimension = PAGE_DIMENSIONS[page.pageSize] || PAGE_DIMENSIONS.A4_PORTRAIT;

  return (
    <div className="flex flex-col items-center w-full">
      {/* Zoom Toolbar */}
      {!readOnly && (
        <div className="no-print bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-full border border-gray-200 shadow-xs mb-3 flex items-center gap-2 text-xs font-bold text-gray-700">
          <button
            onClick={() => setZoomLevel((prev) => Math.max(0.5, prev - 0.1))}
            className="p-1 hover:bg-gray-100 rounded"
            title="झूम कमी करा"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span>{Math.round(zoomLevel * 100)}%</span>
          <button
            onClick={() => setZoomLevel((prev) => Math.min(1.5, prev + 0.1))}
            className="p-1 hover:bg-gray-100 rounded"
            title="झूम वाढवा"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-3 bg-gray-200" />
          <button
            onClick={() => setZoomLevel(1)}
            className="text-[11px] text-gray-500 hover:text-gray-900"
          >
            १००%
          </button>
          <button
            onClick={() => setZoomLevel(0.85)}
            className="text-[11px] text-gray-500 hover:text-gray-900"
          >
            स्क्रीन फिट
          </button>
        </div>
      )}

      {/* Outer Scaled Viewport Container */}
      <div
        className="w-full flex justify-center overflow-auto p-2 sm:p-4"
        ref={containerRef}
      >
        {/* Printable/Exportable Canvas Surface with Fixed Proportions */}
        <div
          id={`newspaper-page-canvas-${page.pageNumber}`}
          className="newspaper-page-canvas bg-[#FAFAF8] text-gray-900 shadow-2xl border border-gray-300 relative transition-transform duration-150 origin-top"
          style={{
            width: `${dimension.width}px`,
            minHeight: `${dimension.height}px`,
            transform: `scale(${zoomLevel})`,
            padding: "32px 36px",
          }}
        >
          {/* Inject all 4 Google Marathi Fonts for this canvas */}
          <link rel="stylesheet" href={GOOGLE_FONTS_NEWSPAPER_URL} />

          {/* Double Decorative Border typical of Indian Regional Newspapers */}
          <div className="absolute inset-3 border border-gray-300 pointer-events-none" />
          <div className="absolute inset-4 border-2 border-red-950 pointer-events-none" />

          {/* Content Area Inside Margin */}
          <div className="relative z-10 flex flex-col justify-between min-h-[inherit] space-y-2">
            {page.modules.map((mod) => {
              const isSelected = selectedModuleId === mod.id;

              return (
                <div key={mod.id} className="relative group">
                  <ModuleRenderer
                    module={mod}
                    isSelected={isSelected}
                    onSelect={() => onSelectModule(mod.id)}
                    readOnly={readOnly}
                  />

                  {/* Quick Action Floating Controls on Hover / Selection */}
                  {!readOnly && isSelected && (
                    <div className="no-print absolute -top-3 right-2 z-30 flex items-center gap-1 bg-red-900 text-white rounded px-2 py-0.5 shadow text-[10px] font-bold">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveModule(mod.id, "up");
                        }}
                        className="p-0.5 hover:bg-red-800 rounded"
                        title="वर हलवा"
                      >
                        <MoveUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveModule(mod.id, "down");
                        }}
                        className="p-0.5 hover:bg-red-800 rounded"
                        title="खाली हलवा"
                      >
                        <MoveDown className="w-3 h-3" />
                      </button>
                      <div className="w-[1px] h-2.5 bg-red-700" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteModule(mod.id);
                        }}
                        className="p-0.5 hover:bg-red-700 rounded text-red-200 hover:text-white"
                        title="मॉड्यूल हटवा"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

