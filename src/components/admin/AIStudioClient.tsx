"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Send,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  FileText,
  Share2,
  Newspaper,
  Bell,
  ArrowRight,
  ShieldCheck,
  Layers,
  MapPin,
  Image as ImageIcon,
} from "lucide-react";
import { createAIDraftArticleAction } from "@/actions/article.actions";
import FeaturedImageUploader from "@/components/admin/FeaturedImageUploader";

interface CategoryItem {
  id: string;
  name: string;
  nameMarathi: string;
}

interface AIStudioClientProps {
  categories: CategoryItem[];
}

export default function AIStudioClient({ categories }: AIStudioClientProps) {
  const router = useRouter();
  const [notes, setNotes] = useState(
    "जामखेड बाजार समितीमध्ये कांद्याची आवक वाढली. आज सुमारे २५००० गोण्यांची आवक. उच्च प्रतीच्या कांद्याला २८०० रुपये प्रतिक्विंटल भाव मिळाला. सोलापूर, बीड भागातील शेतकरी उपस्थित. बाजार समिती सभापतींचे पारदर्शक वजन काट्याबाबत वक्तव्य."
  );
  const [location, setLocation] = useState("जामखेड");
  const [language, setLanguage] = useState<"marathi" | "hindi" | "english">("marathi");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [featuredImage, setFeaturedImage] = useState("");

  const [loading, setLoading] = useState(false);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [activeAction, setActiveAction] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [copiedField, setCopiedField] = useState<string>("");

  // Result state
  const [result, setResult] = useState<{
    headline: string;
    subheadline: string;
    summary: string;
    body_markdown: string;
    key_takeaways: string[];
    seo: {
      meta_title: string;
      meta_description: string;
      focus_keywords: string[];
      slug: string;
    };
    social: {
      facebook_caption: string;
      instagram_caption: string;
      whatsapp_message: string;
    };
    insufficient_info_flag?: boolean;
    missing_details_note?: string;
  } | null>(null);

  const [quickResult, setQuickResult] = useState<string>("");

  const handleAIAction = async (action: string) => {
    if (!notes.trim()) {
      setError("कृपया किमान २-३ ओळींचे टिपण किंवा बुलेट पॉईंट्स प्रविष्ट करा.");
      return;
    }

    setLoading(true);
    setActiveAction(action);
    setError("");
    setQuickResult("");

    try {
      const res = await fetch("/api/ai/studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes,
          location,
          language,
          action,
          headline: result?.headline,
          currentBody: result?.body_markdown,
          categoryId: categoryId || undefined,
          imageUrl: featuredImage || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "प्रक्रिया अयशस्वी झाली.");
      }

      if (action === "GENERATE_ARTICLE") {
        setResult(json.data);
      } else {
        // Targeted actions update specific fields or quick result
        if (json.data.resultText) {
          setQuickResult(json.data.resultText);
        }
        if (json.data.headline && result) {
          setResult({ ...result, headline: json.data.headline });
        }
        if (json.data.summary && result) {
          setResult({ ...result, summary: json.data.summary });
        }
        if (json.data.body_markdown && result) {
          setResult({ ...result, body_markdown: json.data.body_markdown });
        }
        if (json.data.seo && result) {
          setResult({ ...result, seo: json.data.seo });
        }
        if (json.data.social && result) {
          setResult({ ...result, social: json.data.social });
        }
        if (json.data.key_takeaways && result) {
          setResult({ ...result, key_takeaways: json.data.key_takeaways });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "AI एरर आली.";
      setError(msg);
    } finally {
      setLoading(false);
      setActiveAction("");
    }
  };

  const copyText = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const handleCreateDraft = async () => {
    if (!result) return;
    if (!categoryId) {
      setError("AI ने दिलेला विभाग उपलब्ध नाही. कृपया उपलब्ध विभागातून Category निवडा.");
      return;
    }
    setIsCreatingDraft(true);
    setError("");
    try {
      const res = await createAIDraftArticleAction({
        headline: result.headline,
        subheadline: result.subheadline,
        summary: result.summary,
        bodyMarkdown: result.body_markdown,
        categoryId: categoryId,
        featuredImage: featuredImage || undefined,
        slug: result.seo?.slug,
        seoTitle: result.seo?.meta_title,
        seoDescription: result.seo?.meta_description,
        seoKeywords: result.seo?.focus_keywords?.join(", "),
      });
      if (res.success && res.draftId) {
        router.push(`/admin/articles/new?draftId=${res.draftId}`);
      } else {
        setError(res.error || "मसुदा तयार करताना त्रुटी आली.");
      }
    } catch (err: any) {
      setError(err?.message || "मसुदा तयार करताना त्रुटी आली.");
    } finally {
      setIsCreatingDraft(false);
    }
  };

  const aiActionButtons = [
    { id: "GENERATE_ARTICLE", label: "१. संपूर्ण बातमी तयार करा (Generate Article)", primary: true },
    { id: "REWRITE_HEADLINE", label: "२. आकर्षक शीर्षक (Rewrite Headline)" },
    { id: "GENERATE_SEO", label: "३. SEO व स्लग (Generate SEO)" },
    { id: "IMPROVE_MARATHI", label: "४. मराठी भाषा सुधारणा (Improve Marathi)" },
    { id: "SHORTEN_ARTICLE", label: "५. बातमी संक्षिप्त करा (Shorten Article)" },
    { id: "EXPAND_ARTICLE", label: "६. पार्श्वभूमीसह विस्तार (Expand Article)" },
    { id: "GENERATE_SUMMARY", label: "७. सारांश / देख (Generate Summary)" },
    { id: "GENERATE_KEY_TAKEAWAYS", label: "८. महत्त्वाचे मुद्दे (Key Takeaways)" },
    { id: "GENERATE_FACEBOOK_CAPTION", label: "९. फेसबुक पोस्ट (Facebook Caption)" },
    { id: "GENERATE_INSTAGRAM_CAPTION", label: "१०. इन्स्टाग्राम पोस्ट (Instagram Caption)" },
    { id: "GENERATE_WHATSAPP_MESSAGE", label: "११. व्हॉट्सॲप मेसेज (WhatsApp Message)" },
    { id: "GENERATE_BREAKING_HEADLINE", label: "१२. ब्रेकिंग न्यूज शीर्षक (Breaking Headline)" },
    { id: "GENERATE_PUSH_NOTIFICATION", label: "१३. पुश नोटिफिकेशन (Push Notification)" },
    { id: "GENERATE_CLIPPING_TEXT", label: "१४. वृत्तपत्र कात्रण मजकूर (Clipping Text)" },
  ];

  return (
    <div className="space-y-6">
      {/* Studio Masthead */}
      <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-red-950 text-white p-6 sm:p-8 rounded-2xl shadow-sm border border-purple-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-yellow-400 text-gray-950 text-xs font-black px-3 py-1 rounded-full uppercase mb-2 shadow">
            <Sparkles className="w-3.5 h-3.5 text-purple-900" />
            <span>AI Gateway Enabled • Multi-Provider Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-headline">
            AI न्यूज स्टुडिओ (AI Newsroom Studio)
          </h1>
          <p className="text-xs sm:text-sm text-purple-200 mt-1 max-w-2xl leading-relaxed">
            कच्च्या नोंदींमधून विश्वसनीय, वस्तुस्थिती-आधारित मराठी बातम्या, SEO आणि सोशल मीडिया मजकूर तयार करा.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20 text-xs font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-400" />
            <span>AI Assisted — Editor Verified</span>
          </div>
          <Link
            href="/admin/settings/ai"
            className="bg-yellow-400 hover:bg-yellow-300 text-gray-950 font-black px-3 py-2 rounded-xl text-xs transition-colors shadow-sm whitespace-nowrap"
          >
            ⚙️ AI प्रोव्हायडर बदला &rarr;
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-900 rounded-xl border border-red-200 flex items-center gap-2 text-xs font-bold">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Input Notes on Left (5 cols) & Output Preview on Right (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Reporter Input & 14 Buttons */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black font-headline text-gray-900">
                कच्च्या नोंदी व माहिती (Reporter Notes)
              </h2>
              <span className="text-[11px] text-gray-400 font-semibold">२-१० बुलेट पॉईंट्स</span>
            </div>

            <textarea
              rows={6}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="पत्रकाराने घेतलेल्या कच्च्या नोंदी, व्हॉइस नोट्स किंवा माहिती येथे टाईप करा..."
              className="w-full border border-gray-300 rounded-lg p-3 text-xs sm:text-sm font-medium text-gray-900 focus:ring-2 focus:ring-purple-700 focus:outline-none leading-relaxed"
            />

            <div className="grid grid-cols-2 gap-3 text-xs font-bold">
              <div>
                <label className="block text-gray-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-purple-700" />
                  <span>स्थान (Location):</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="उदा. जामखेड / खर्डा"
                  className="w-full border border-gray-300 rounded p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-1">इनपुट भाषा (Language):</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="w-full border border-gray-300 rounded p-2 text-xs bg-gray-50"
                >
                  <option value="marathi">मराठी (Marathi)</option>
                  <option value="hindi">हिंदी (Hindi)</option>
                  <option value="english">इंग्रजी (English)</option>
                </select>
              </div>
            </div>

            {/* Category Selector */}
            <div className="text-xs font-bold">
              <label className="block text-gray-700 mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-purple-700" />
                <span>बातमी विभाग (Category):</span>
              </label>
              {categories.length > 0 ? (
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2.5 text-xs bg-gray-50 font-semibold text-gray-900 focus:ring-2 focus:ring-purple-700"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameMarathi} ({c.name})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-amber-50 text-amber-900 rounded-lg border border-amber-200 text-xs font-medium">
                  ⚠️ डेटाबेसमध्ये कोणताही बातमी विभाग उपलब्ध नाही (Production Category table is empty). कृपया ॲडमिन पॅनलमधून प्रथम विभाग तयार करा.
                </div>
              )}
            </div>

            {/* Photo Upload with Sharp Optimizer */}
            <div className="pt-2 border-t border-gray-100">
              <FeaturedImageUploader
                value={featuredImage}
                onChange={(url) => setFeaturedImage(url)}
                label="बातमीचा कव्हर फोटो (Featured Image)"
              />
            </div>

            {/* Strict Editorial Rules Box */}
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900 leading-normal">
              <p className="font-bold flex items-center gap-1 mb-1">
                <span>⚠️</span> न्यूजरूम मार्गदर्शक नियम:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-amber-800">
                <li>AI कधीही स्वतःहून नवीन आकडे, नावे किंवा आरोप तयार करणार नाही.</li>
                <li>अपूर्ण माहिती असल्यास AI अलर्ट फ्लॅग दर्शवेल.</li>
              </ul>
            </div>
          </div>

          {/* 14 Action Buttons */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-700 mb-2">
              १४ AI संपादकीय साधने (14 Editorial Tools)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {aiActionButtons.map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => handleAIAction(btn.id)}
                  disabled={loading}
                  className={`p-2.5 rounded-lg font-bold text-left transition-all flex items-center justify-between ${
                    btn.primary
                      ? "bg-purple-800 hover:bg-purple-700 text-white shadow sm:col-span-2 text-center justify-center gap-2"
                      : "bg-gray-50 hover:bg-purple-50 hover:text-purple-900 text-gray-800 border border-gray-200"
                  } ${activeAction === btn.id ? "ring-2 ring-purple-600 animate-pulse" : ""}`}
                >
                  <span className="truncate">{btn.label}</span>
                  {activeAction === btn.id && (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin ml-1 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI Results Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Quick Result Alert Box if an action returns direct text */}
          {quickResult && (
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-purple-900">
                  AI निकाल (Result):
                </span>
                <button
                  onClick={() => copyText(quickResult, "quick")}
                  className="text-xs text-purple-700 hover:underline flex items-center gap-1 font-semibold"
                >
                  {copiedField === "quick" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === "quick" ? "कॉपी झाले!" : "कॉपी करा"}</span>
                </button>
              </div>
              <p className="text-sm font-bold text-gray-950 leading-relaxed bg-white p-3 rounded-lg border border-purple-100">
                {quickResult}
              </p>
            </div>
          )}

          {result ? (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              {/* Internal Status Tag & Edit in Article Editor Button */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="bg-green-100 text-green-800 text-xs font-black px-2.5 py-1 rounded-full border border-green-300">
                    ✓ AI Assisted — Editor Verified
                  </span>
                  {result.insufficient_info_flag && (
                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-300 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      माहिती अपूर्ण
                    </span>
                  )}
                </div>

                <button
                  onClick={handleCreateDraft}
                  disabled={isCreatingDraft}
                  className="bg-red-800 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {isCreatingDraft ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>मसुदा तयार होत आहे...</span>
                    </>
                  ) : (
                    <>
                      <span>बातमी संपादित करा (Edit in Article)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Headline */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    मुख्य शीर्षक (Headline):
                  </label>
                  <button
                    onClick={() => copyText(result.headline, "headline")}
                    className="text-xs text-gray-500 hover:text-purple-800 flex items-center gap-1"
                  >
                    {copiedField === "headline" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>कॉपी</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={result.headline}
                  onChange={(e) => setResult({ ...result, headline: e.target.value })}
                  className="w-full text-base font-black text-gray-900 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-700"
                />
              </div>

              {/* Subheadline & Summary */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    उपशीर्षक (Subheadline):
                  </label>
                  <input
                    type="text"
                    value={result.subheadline}
                    onChange={(e) => setResult({ ...result, subheadline: e.target.value })}
                    className="w-full text-xs font-semibold text-gray-800 border border-gray-300 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    बातमीचा सारांश (Summary):
                  </label>
                  <textarea
                    rows={2}
                    value={result.summary}
                    onChange={(e) => setResult({ ...result, summary: e.target.value })}
                    className="w-full text-xs text-gray-800 border border-gray-300 rounded-lg p-2"
                  />
                </div>
              </div>

              {/* Key Takeaways */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  महत्त्वाचे मुद्दे (Key Takeaways):
                </label>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-1 text-xs">
                  {result.key_takeaways.map((point, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-gray-800">
                      <span className="text-purple-700 font-bold">•</span>
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Body Markdown */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    सविस्तर बातमी मजकूर (Body Markdown):
                  </label>
                  <button
                    onClick={() => copyText(result.body_markdown, "body")}
                    className="text-xs text-gray-500 hover:text-purple-800 flex items-center gap-1"
                  >
                    {copiedField === "body" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>कॉपी</span>
                  </button>
                </div>
                <textarea
                  rows={8}
                  value={result.body_markdown}
                  onChange={(e) => setResult({ ...result, body_markdown: e.target.value })}
                  className="w-full font-mono text-xs border border-gray-300 rounded-lg p-3 leading-relaxed"
                />
              </div>

              {/* Social Captions Accordion */}
              <div className="pt-4 border-t border-gray-200 space-y-3 text-xs">
                <h4 className="font-bold text-gray-800 uppercase tracking-wider">
                  सोशल मीडिया शेअर संदेश (Social Captions):
                </h4>

                {/* WhatsApp */}
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-1 text-green-900 font-bold">
                    <span>व्हॉट्सॲप शेअर संदेश:</span>
                    <button
                      onClick={() => copyText(result.social.whatsapp_message, "wa")}
                      className="text-xs text-green-700 hover:underline flex items-center gap-1"
                    >
                      {copiedField === "wa" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === "wa" ? "कॉपी झाले!" : "कॉपी करा"}</span>
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-gray-800 text-xs">
                    {result.social.whatsapp_message}
                  </pre>
                </div>

                {/* Facebook */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-1 text-blue-900 font-bold">
                    <span>फेसबुक कॅप्शन:</span>
                    <button
                      onClick={() => copyText(result.social.facebook_caption, "fb")}
                      className="text-xs text-blue-700 hover:underline flex items-center gap-1"
                    >
                      {copiedField === "fb" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === "fb" ? "कॉपी झाले!" : "कॉपी करा"}</span>
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-gray-800 text-xs">
                    {result.social.facebook_caption}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-300 text-center flex flex-col items-center justify-center text-gray-400 space-y-3">
              <Sparkles className="w-12 h-12 text-purple-300" />
              <p className="text-sm font-bold text-gray-600">
                डाव्या बाजूला कच्च्या नोंदी प्रविष्ट करा आणि कोणत्याही AI बटणावर क्लिक करा.
              </p>
              <p className="text-xs max-w-sm">
                'संपूर्ण बातमी तयार करा' वर क्लिक केल्यास संपूर्ण मसुदा, सोशल कॅप्शन्स आणि SEO सह तयार होईल, आणि 'बातमी संपादित करा' वर क्लिक करून थेट मसुद्यात जाता येईल.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

