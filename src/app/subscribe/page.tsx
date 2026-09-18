"use client";

import React, { useState } from "react";
import Header from "@/components/public/Header";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { MessageSquare, Bell, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";

export default function SubscribePage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("जामखेड");
  const [categories, setCategories] = useState<string[]>(["politics", "agriculture", "local-news"]);
  const [consent, setConsent] = useState(true);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const [pushStatus, setPushStatus] = useState<string>("ब्राउझर पुश नोटिफिकेशन्स सक्षम करा");

  const toggleCategory = (cat: string) => {
    if (categories.includes(cat)) {
      setCategories(categories.filter((c) => c !== cat));
    } else {
      setCategories([...categories, cat]);
    }
  };

  const handleWhatsAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      alert("कृपया संमती द्या.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/whatsapp/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          location,
          preferredCategories: categories,
          consent,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage("धन्यवाद! आपले नाव 'आवाज जामखेडचा' अधिकृत व्हॉट्सॲप बुलेटिनसाठी यशस्वीरीत्या नोंदवले गेले आहे.");
      } else {
        setStatus("error");
        setMessage(data.error || "नोंदणी करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.");
      }
    } catch {
      setStatus("error");
      setMessage("सर्व्हरशी संपर्क होऊ शकला नाही.");
    }
  };

  const handleEnablePush = async () => {
    if (!("Notification" in window)) {
      alert("आपला ब्राउझर पुश नोटिफिकेशन्सना सपोर्ट करत नाही.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setPushStatus("✅ नोटिफिकेशन्स यशस्वीरीत्या सुरू झाली आहेत!");
      } else {
        setPushStatus("❌ परवानगी नाकारली गेली.");
      }
    } catch {
      setPushStatus("त्रुटी आली.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-10 w-full">
        {/* Top Banner */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-900 px-3 py-1 rounded-full text-xs font-bold uppercase mb-2">
            <MessageSquare className="w-3.5 h-3.5 text-green-700" />
            <span>अधिकृत वाचक मंच</span>
          </span>
          <h1 className="text-3xl sm:text-4xl font-black font-headline text-gray-950">
            आवाज जामखेडचा डिजिटल न्यूज बुलेटिन
          </h1>
          <p className="text-sm text-gray-600 mt-2 max-w-xl mx-auto">
            दररोज सकाळी थेट आपल्या व्हॉट्सॲपवर आणि ब्राउझरवर जामखेड, खर्डा, चोंडी व अहिल्यानगर परिसरातील ताज्या बातम्या मिळवा.
          </p>
        </div>

        {/* 2-Column Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: WhatsApp Opt-In Form */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-950">
                  व्हॉट्सॲप बुलेटिन (WhatsApp Opt-In)
                </h2>
                <p className="text-xs text-gray-500">कोणतेही स्पॅम मेसेज नाहीत • १००% मोफत</p>
              </div>
            </div>

            {status === "success" ? (
              <div className="p-6 bg-green-50 text-green-900 rounded-xl border border-green-200 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <h3 className="font-bold text-base">नोंदणी पूर्ण झाली!</h3>
                <p className="text-xs text-green-800 mt-2">{message}</p>
              </div>
            ) : (
              <form onSubmit={handleWhatsAppSubmit} className="space-y-4 text-xs sm:text-sm">
                {status === "error" && (
                  <div className="p-3 bg-red-50 text-red-800 rounded border border-red-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{message}</span>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-gray-800 mb-1">आपले पूर्ण नाव:</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="उदा. राहुल शिंदे"
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-800 mb-1">
                    व्हॉट्सॲप मोबाईल नंबर (१० अंकी):
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 किंवा 98XXXXXXXX"
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-800 mb-1">आपले गाव / शहर:</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="उदा. जामखेड / खर्डा / चोंडी"
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-800 mb-1.5">
                    आवडीचे विषय (कमीत कमी १ निवडा):
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { id: "politics", label: "राजकारण" },
                      { id: "agriculture", label: "शेती व बाजारभाव" },
                      { id: "local-news", label: "स्थानिक घडामोडी" },
                      { id: "crime", label: "गुन्हेगारी" },
                      { id: "govt-schemes", label: "शासन योजना" },
                    ].map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => toggleCategory(c.id)}
                        className={`p-2 rounded border text-left font-medium transition-colors ${
                          categories.includes(c.id)
                            ? "bg-green-100 border-green-600 text-green-950 font-bold"
                            : "bg-gray-50 border-gray-200 text-gray-700"
                        }`}
                      >
                        {categories.includes(c.id) ? "✓ " : "+ "}
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="consent"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-1 accent-green-600"
                  />
                  <label htmlFor="consent" className="text-xs text-gray-600 cursor-pointer">
                    मी 'आवाज जामखेडचा' कडून अधिकृत व्हॉट्सॲप बातम्या आणि बुलेटिन स्वीकारण्यास संमती देत आहे. (आपण कधीही सदस्यत्व रद्द करू शकता).
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold py-3 rounded-lg transition-colors shadow-sm text-sm flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4 fill-white" />
                  <span>{status === "loading" ? "नोंदणी होत आहे..." : "व्हॉट्सॲपवर सदस्य व्हा"}</span>
                </button>
              </form>
            )}
          </div>

          {/* Card 2: Browser Push Notifications */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-950">
                    वेब पुश नोटिफिकेशन्स (Web Push Alerts)
                  </h2>
                  <p className="text-xs text-gray-500">अति-महत्त्वाच्या ब्रेकिंग न्यूज तत्काळ मिळवा</p>
                </div>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                जेव्हा जामखेड किंवा पंचक्रोशीत मोठी ब्रेकिंग न्यूज घडेल किंवा अति-तातडीचे शासन निर्णय जाहीर होतील, तेव्हा आपल्या मोबाईल किंवा लॅपटॉप स्क्रीनवर त्वरित नोटिफिकेशन पाठवले जाईल.
              </p>

              <div className="my-6 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-gray-800 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>कोणतीही वैयक्तिक माहिती लागत नाही.</span>
                </div>
                <div className="flex items-center gap-2 text-gray-800 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>एका क्लिकवर सुरू किंवा बंद करता येते.</span>
                </div>
                <div className="flex items-center gap-2 text-gray-800 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>दिवसातून कमाल २ ते ३ महत्त्वाच्या बातम्या.</span>
                </div>
              </div>
            </div>

            <div>
              <button
                onClick={handleEnablePush}
                className="w-full bg-red-800 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors shadow-sm text-sm flex items-center justify-center gap-2"
              >
                <Bell className="w-4 h-4" />
                <span>{pushStatus}</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

