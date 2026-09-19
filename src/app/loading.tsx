import React from "react";
import { Loader2 } from "lucide-react";

export default function RootLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 font-marathi">
      <div className="flex flex-col items-center space-y-4 max-w-sm text-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-red-600/10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-red-700" />
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-gray-900">
            आवाज जामखेडचा
          </h3>
          <p className="text-xs text-gray-500">
            ताज्या बातम्या लोड होत आहेत, कृपया प्रतीक्षा करा...
          </p>
        </div>
      </div>
    </div>
  );
}

