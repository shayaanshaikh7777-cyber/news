import React from "react";
import { Radio, Clock, User } from "lucide-react";

export interface LiveUpdateItem {
  id: string;
  timestamp: Date | string;
  authorName: string;
  content: string;
  editedAt?: Date | string | null;
}

export default function LiveUpdates({ updates = [] }: { updates: LiveUpdateItem[] }) {
  if (!updates || updates.length === 0) return null;

  // Sort chronological descending (latest first)
  const sorted = [...updates].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="my-8 bg-red-50/60 rounded-xl p-5 border-2 border-red-200 shadow-sm">
      {/* Header Badge */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-red-200">
        <div className="flex items-center gap-2 text-red-900 font-black text-lg">
          <span className="relative flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-600"></span>
          </span>
          <Radio className="w-5 h-5 text-red-700" />
          <span>लाईव्ह अपडेट्स (Live Chronological Updates)</span>
        </div>
        <span className="text-xs bg-red-800 text-white font-bold px-2.5 py-0.5 rounded-full">
          {updates.length} नवीन नोंदी
        </span>
      </div>

      {/* Timeline entries */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-red-300">
        {sorted.map((item) => {
          const timeFormatted = new Intl.DateTimeFormat("mr-IN", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
          }).format(new Date(item.timestamp));

          return (
            <div key={item.id} className="relative group">
              {/* Timeline marker node */}
              <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-red-600 border-2 border-white ring-2 ring-red-300 group-hover:scale-125 transition-transform" />

              <div className="bg-white p-3.5 rounded-lg border border-red-100 shadow-sm">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5 font-semibold">
                  <span className="text-red-900 font-black flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-red-700" />
                    {timeFormatted}
                  </span>
                  <span className="flex items-center gap-1 text-gray-600">
                    <User className="w-3 h-3 text-gray-400" />
                    {item.authorName}
                  </span>
                </div>

                <p className="text-sm sm:text-base text-gray-900 font-medium leading-relaxed">
                  {item.content}
                </p>

                {item.editedAt && (
                  <p className="text-[10px] text-gray-400 mt-1 italic">
                    (संपादित:{" "}
                    {new Intl.DateTimeFormat("mr-IN", {
                      hour: "numeric",
                      minute: "numeric",
                    }).format(new Date(item.editedAt))}
                    )
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

