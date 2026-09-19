import React from "react";
import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="space-y-6 font-marathi animate-pulse" aria-busy="true" aria-live="polite">
      {/* Top Banner / Breadcrumb Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-gray-200 rounded-lg" />
          <div className="h-4 w-72 bg-gray-200 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-32 bg-gray-200 rounded-xl" />
          <div className="h-10 w-28 bg-gray-200 rounded-xl" />
        </div>
      </div>

      {/* Loading Status Indicator */}
      <div className="flex items-center gap-2 text-sm text-gray-500 font-medium py-1">
        <Loader2 className="w-4 h-4 animate-spin text-red-600" />
        <span>माहिती लोड होत आहे, कृपया प्रतीक्षा करा...</span>
      </div>

      {/* Metric Cards Skeleton Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="w-8 h-8 rounded-lg bg-gray-200" />
            </div>
            <div className="h-8 w-20 bg-gray-200 rounded-lg" />
            <div className="h-3 w-36 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Table / Content Skeleton */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="h-5 w-40 bg-gray-200 rounded" />
          <div className="h-8 w-24 bg-gray-200 rounded-lg" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
            >
              <div className="space-y-2 flex-1 max-w-xl">
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
                <div className="h-3 w-1/2 bg-gray-100 rounded" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-16 bg-gray-200 rounded-full" />
                <div className="h-6 w-20 bg-gray-100 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

