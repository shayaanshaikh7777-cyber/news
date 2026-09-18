"use client";

import React, { useState } from "react";
import { loginAction } from "@/actions/auth.actions";
import { useRouter } from "next/navigation";
import { Lock, Mail, ShieldAlert, ArrowRight } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const res = await loginAction(formData);

    if (res.success) {
      router.push("/admin");
      router.refresh();
    } else {
      setError(res.error || "लॉगिन अयशस्वी झाले.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-marathi">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
        {/* Newsroom Masthead Header */}
        <div className="bg-red-950 p-6 text-center text-white border-b-4 border-red-800">
          <span className="text-[11px] font-bold tracking-widest text-red-300 uppercase block">
            आवाज जामखेडचा डिजिटल न्यूजरूम
          </span>
          <h1 className="text-3xl font-black font-headline mt-1">
            न्यूजरूम सीएमएस लॉगिन
          </h1>
          <p className="text-xs text-gray-300 mt-1">
            संपादक, बातमीदार आणि प्रशासक सुरक्षित प्रवेश
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-bold text-gray-800 mb-1">ईमेल आयडी:</label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  required
                  defaultValue="admin@test.com"
                  placeholder="admin@test.com"
                  className="w-full border border-gray-300 rounded-lg py-2.5 pl-9 pr-3 text-gray-900 focus:ring-2 focus:ring-red-700 focus:outline-none font-semibold"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-800 mb-1">पासवर्ड:</label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  required
                  defaultValue="Aa@12345"
                  placeholder="••••••••"
                  className="w-full border border-gray-300 rounded-lg py-2.5 pl-9 pr-3 text-gray-900 focus:ring-2 focus:ring-red-700 focus:outline-none font-semibold"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-800 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors shadow flex items-center justify-center gap-2 text-sm"
            >
              <span>{loading ? "प्रवेश करत आहे..." : "न्यूजरूममध्ये प्रवेश करा (Login)"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Master Admin Credentials Box */}
          <div className="mt-6 pt-5 border-t border-gray-200 text-xs text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <p className="font-bold text-gray-900 mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
              <span>अधिकृत ॲडमीन लॉगिन क्रेडेंशियल्स:</span>
            </p>
            <div className="space-y-1.5 font-mono text-xs bg-white p-2.5 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">ईमेल:</span>
                <span className="font-bold text-red-900">admin@test.com</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">पासवर्ड:</span>
                <span className="font-bold text-gray-900">Aa@12345</span>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 mt-2">
              टीप: वरील बटण दाबून आपण थेट संपूर्ण न्यूजरूम सीएमएस व सर्व अधिकारांसह प्रवेश करू शकता.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
