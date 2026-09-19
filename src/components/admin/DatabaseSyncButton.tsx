"use client";

import React, { useState, useTransition } from "react";
import { Database, CheckCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { syncDatabaseSchemaAction, DatabaseSyncResult } from "@/actions/database.actions";

export default function DatabaseSyncButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<DatabaseSyncResult | null>(null);

  const handleSync = () => {
    startTransition(async () => {
      const res = await syncDatabaseSchemaAction();
      setResult(res);
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 font-marathi">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-red-700" />
            <h3 className="text-sm font-bold text-gray-950">
              डेटाबेस स्कीमा सिंक्रोनायझेशन (Database Schema Sync)
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-xl">
            Category, Location, Article, MediaAsset सह सर्व आवश्यक सारण्या (Tables) तयार व सिंक करा.
            यातून कोणताही विद्यमान डेटा नष्ट होत नाही (100% Non-destructive).
          </p>
        </div>

        <button
          type="button"
          disabled={isPending}
          onClick={handleSync}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm ${
            isPending
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-red-800 hover:bg-red-700 active:scale-95"
          }`}
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>स्कीमा सिंक होत आहे...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              <span>स्कीमा सिंक करा (Sync Schema)</span>
            </>
          )}
        </button>
      </div>

      {result && (
        <div
          className={`p-4 rounded-xl text-xs font-medium border flex items-start gap-3 ${
            result.success
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          {result.success ? (
            <CheckCircle className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
          )}

          <div className="space-y-1">
            <p className="font-bold">{result.message}</p>
            {result.tablesVerified && result.tablesVerified.length > 0 && (
              <p className="text-emerald-700 text-[11px]">
                सत्यापित सारण्या: {result.tablesVerified.join(", ")}
              </p>
            )}
            {result.error && (
              <p className="text-red-700 font-mono text-[11px]">त्रुटी: {result.error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

