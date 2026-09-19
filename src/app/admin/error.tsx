"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, Database } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log client/server error digest safely
    console.error("[Admin Error Boundary Caught]", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  const isDbError =
    error.message?.includes("DATABASE_NOT_CONFIGURED") ||
    error.message?.includes("database") ||
    error.message?.includes("PrismaClient") ||
    error.message?.includes("connect") ||
    error.digest?.includes("DATABASE");

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
          {isDbError ? (
            <Database className="w-8 h-8" />
          ) : (
            <AlertTriangle className="w-8 h-8" />
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {isDbError
              ? "डेटाबेस कनेक्शन उपलब्ध नाही (Database Offline)"
              : "काहीतरी त्रुटी झाली (Server Component Error)"}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            {isDbError
              ? "प्रॉडक्शन डेटाबेस (PostgreSQL DATABASE_URL) Vercel किंवा सर्व्हरवर योग्यरित्या कॉन्फिगर केलेले नाही किंवा डेटाबेस सर्व्हर तात्पुरता अनुपलब्ध आहे."
              : "हे पेज लोड करताना सर्व्हरवर त्रुटी आली आहे. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा."}
          </p>
        </div>

        {isDbError && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-left text-xs font-mono text-slate-700 dark:text-slate-300 space-y-2">
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              🛠️ व्यवस्थापकीय उपाय (Admin Action Required):
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Vercel Dashboard &rarr; Project &rarr; Settings &rarr; Environment Variables तपासा.</li>
              <li>वैध PostgreSQL <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">DATABASE_URL</code> सेट करा.</li>
              <li>डेटाबेस मायग्रेशन (<code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">npx prisma migrate deploy</code>) रन करा.</li>
            </ul>
          </div>
        )}

        {error.digest && (
          <p className="text-xs text-slate-400 font-mono">
            Error Reference ID: {error.digest}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition shadow-sm text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            पुन्हा प्रयत्न करा (Try Again)
          </button>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition text-sm"
          >
            <Home className="w-4 h-4" />
            अ‍ॅडमिन डॅशबोर्ड (Dashboard)
          </Link>
        </div>
      </div>
    </div>
  );
}

