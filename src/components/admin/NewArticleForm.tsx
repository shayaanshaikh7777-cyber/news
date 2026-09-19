"use client";

import React, { useState } from "react";
import { createArticleAction } from "@/actions/article.actions";
import FeaturedImageUploader from "@/components/admin/FeaturedImageUploader";
import {
  Sparkles,
  Save,
  Send,
  Globe,
  Layers,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Share2,
  MapPin,
  FileText,
  HelpCircle,
  Eye,
} from "lucide-react";

interface CategoryItem {
  id: string;
  name: string;
  nameMarathi: string;
}

interface LocationItem {
  id: string;
  village: string;
  taluka: string;
}

interface ReporterItem {
  id: string;
  nameMarathi: string;
  designation: string;
}

interface InitialData {
  headline?: string;
  subheadline?: string;
  summary?: string;
  bodyMarkdown?: string;
  categoryId?: string;
  locationId?: string;
  featuredImage?: string;
  youtubeUrl?: string;
  slug?: string;
  priority?: number;
  isBreaking?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  reporterId?: string;
  draftId?: string;
}

interface NewArticleFormProps {
  categories: CategoryItem[];
  locations: LocationItem[];
  reporters: ReporterItem[];
  initialData: InitialData;
  userIsEditor: boolean;
}

export default function NewArticleForm({
  categories,
  locations,
  reporters,
  initialData,
  userIsEditor,
}: NewArticleFormProps) {
  // Form Field State
  const [headline, setHeadline] = useState(initialData.headline || "");
  const [slug, setSlug] = useState(initialData.slug || "");
  const [subheadline, setSubheadline] = useState(initialData.subheadline || "");
  const [summary, setSummary] = useState(initialData.summary || "");
  const [bodyMarkdown, setBodyMarkdown] = useState(initialData.bodyMarkdown || "");
  const [categoryId, setCategoryId] = useState(initialData.categoryId || categories[0]?.id || "");
  const [locationId, setLocationId] = useState(initialData.locationId || "");
  const [featuredImage, setFeaturedImage] = useState(initialData.featuredImage || "");
  const [youtubeUrl, setYoutubeUrl] = useState(initialData.youtubeUrl || "");
  const [priority, setPriority] = useState(initialData.priority ?? 1);
  const [isBreaking, setIsBreaking] = useState(initialData.isBreaking ?? false);
  const [reporterId, setReporterId] = useState(initialData.reporterId || "");
  const [seoTitle, setSeoTitle] = useState(initialData.seoTitle || "");
  const [seoDescription, setSeoDescription] = useState(initialData.seoDescription || "");
  const [seoKeywords, setSeoKeywords] = useState(initialData.seoKeywords || "");

  // AI Assistant State
  const [aiNotes, setAiNotes] = useState("");
  const [aiLocation, setAiLocation] = useState("जामखेड");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiSuccessMessage, setAiSuccessMessage] = useState("");
  const [copiedField, setCopiedField] = useState("");

  // Social Captions from AI
  const [socialCaptions, setSocialCaptions] = useState<{
    whatsapp?: string;
    facebook?: string;
    keyTakeaways?: string[];
  } | null>(null);

  const handleGenerateWithAI = async () => {
    if (!aiNotes.trim()) {
      setAiError("कृपया बातमी तयार करण्यासाठी किमान २-३ ओळींच्या कच्च्या नोंदी प्रविष्ट करा.");
      return;
    }

    setAiLoading(true);
    setAiError("");
    setAiSuccessMessage("");

    try {
      const res = await fetch("/api/ai/studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: aiNotes.trim(),
          location: aiLocation.trim() || "जामखेड",
          language: "marathi",
          action: "GENERATE_ARTICLE",
          categoryId: categoryId || undefined,
          imageUrl: featuredImage || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "AI बातमी तयार करताना त्रुटी आली.");
      }

      const data = json.data;

      // Populate form fields directly
      if (data.headline) setHeadline(data.headline);
      if (data.subheadline) setSubheadline(data.subheadline);
      if (data.summary) setSummary(data.summary);
      if (data.body_markdown) setBodyMarkdown(data.body_markdown);
      if (data.seo?.slug) setSlug(data.seo.slug);
      if (data.seo?.meta_title) setSeoTitle(data.seo.meta_title);
      if (data.seo?.meta_description) setSeoDescription(data.seo.meta_description);
      if (data.seo?.focus_keywords && Array.isArray(data.seo.focus_keywords)) {
        setSeoKeywords(data.seo.focus_keywords.join(", "));
      }

      setSocialCaptions({
        whatsapp: data.social?.whatsapp_message,
        facebook: data.social?.facebook_caption,
        keyTakeaways: data.key_takeaways,
      });

      setAiSuccessMessage(
        `बातमी मसुदा यशस्वीपणे तयार झाला! (${json.provider || "AI Engine"}: ${json.model || "Active"})`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "AI सहाय्यक त्रुटी आली.";
      setAiError(msg);
    } finally {
      setAiLoading(false);
    }
  };

  const copyText = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(""), 2500);
  };

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* AI NEWS ASSISTANT CARD (✨ AI बातमी सहाय्यक) */}
      {/* ============================================================ */}
      <div className="bg-gradient-to-br from-purple-900 via-indigo-950 to-gray-950 text-white p-6 rounded-2xl border border-purple-800/80 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-purple-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black font-headline text-white flex items-center gap-2">
                <span>AI बातमी सहाय्यक (AI News Assistant)</span>
                <span className="bg-yellow-400 text-gray-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Live
                </span>
              </h2>
              <p className="text-xs text-purple-200">
                कच्च्या नोंदी द्या; AI आपोआप शीर्षक, बातमी मजकूर, SEO आणि सोशल मेसेज तयार करून फॉर्ममध्ये भरेल.
              </p>
            </div>
          </div>

          <span className="text-[11px] font-semibold text-purple-300 bg-purple-900/60 px-2.5 py-1 rounded-lg border border-purple-700/50 self-start sm:self-auto">
            AI Assisted • Editor Verified
          </span>
        </div>

        {aiError && (
          <div className="p-3 bg-red-950/80 text-red-200 rounded-xl border border-red-800 flex items-center gap-2 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{aiError}</span>
          </div>
        )}

        {aiSuccessMessage && (
          <div className="p-3 bg-green-950/80 text-green-200 rounded-xl border border-green-800 flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-green-400" />
            <span>{aiSuccessMessage}</span>
          </div>
        )}

        {/* Assistant Input Grid */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-purple-100">
                कच्च्या नोंदी व माहिती (Reporter Raw Notes / Bullet Points) *
              </label>
              <span className="text-[11px] text-purple-300">किमान २-३ ओळी किंवा मुद्दे</span>
            </div>
            <textarea
              rows={4}
              value={aiNotes}
              onChange={(e) => setAiNotes(e.target.value)}
              placeholder="उदा. जामखेड कृषी उत्पन्न बाजार समितीमध्ये कांद्याची मोठी आवक. आज सुमारे २५००० गोण्यांची आवक झाली. उच्च प्रतीच्या कांद्याला २८०० रुपये प्रतिक्विंटल भाव मिळाला. सोलापूर, बीड भागातील शेतकरी उपस्थित..."
              className="w-full bg-purple-950/60 border border-purple-700/70 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-purple-300/50 focus:ring-2 focus:ring-yellow-400 focus:outline-none leading-relaxed font-sans"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-purple-200 font-bold mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-purple-400" />
                <span>स्थान संदर्भ (Location Context):</span>
              </label>
              <input
                type="text"
                value={aiLocation}
                onChange={(e) => setAiLocation(e.target.value)}
                placeholder="उदा. जामखेड / खर्डा / नानज"
                className="w-full bg-purple-950/60 border border-purple-700/70 rounded-lg p-2.5 text-xs text-white placeholder-purple-300/50 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-purple-200 font-bold mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>विभाग (Category Selection):</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-purple-950/90 border border-purple-700/70 rounded-lg p-2.5 text-xs text-white focus:ring-2 focus:ring-yellow-400 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-gray-900 text-white">
                    {c.nameMarathi} ({c.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-[11px] text-purple-300 flex items-center gap-1.5">
              <span>💡</span>
              <span>
                बटण दाबल्यावर खालील मथळा, सारांश, सविस्तर बातमी व SEO रकाने त्वरित भरले जातील.
              </span>
            </div>

            <button
              type="button"
              onClick={handleGenerateWithAI}
              disabled={aiLoading}
              className="w-full sm:w-auto bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-gray-950 font-black px-6 py-2.5 rounded-xl text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-60 disabled:pointer-events-none"
            >
              {aiLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-gray-950" />
                  <span>AI बातमी तयार करत आहे...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-gray-950" />
                  <span>✨ AI ने बातमी तयार करा (Generate Story)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI Social Broadcast Box (WhatsApp & Facebook 1-click copy) */}
        {socialCaptions && (
          <div className="mt-4 pt-4 border-t border-purple-800/60 space-y-3 bg-purple-950/40 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-yellow-300 uppercase tracking-wider flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" />
                <span>सोशल मीडिया ब्रॉडकास्ट (१-क्लिक कॉपी)</span>
              </span>
              <span className="text-[10px] text-purple-300">बातमी प्रसिद्ध झाल्यावर पाठवण्यासाठी</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* WhatsApp Broadcast */}
              {socialCaptions.whatsapp && (
                <div className="bg-green-950/60 border border-green-700/60 p-3 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-green-300 font-bold">
                    <span>📱 व्हॉट्सॲप मेसेज:</span>
                    <button
                      type="button"
                      onClick={() => copyText(socialCaptions.whatsapp!, "wa")}
                      className="text-xs text-green-200 hover:text-white bg-green-800/80 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                    >
                      {copiedField === "wa" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === "wa" ? "कॉपी झाले!" : "कॉपी करा"}</span>
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-green-100 text-[11px] leading-relaxed max-h-28 overflow-y-auto">
                    {socialCaptions.whatsapp}
                  </pre>
                </div>
              )}

              {/* Facebook Broadcast */}
              {socialCaptions.facebook && (
                <div className="bg-blue-950/60 border border-blue-700/60 p-3 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-blue-300 font-bold">
                    <span>📘 फेसबुक पोस्ट:</span>
                    <button
                      type="button"
                      onClick={() => copyText(socialCaptions.facebook!, "fb")}
                      className="text-xs text-blue-200 hover:text-white bg-blue-800/80 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                    >
                      {copiedField === "fb" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === "fb" ? "कॉपी झाले!" : "कॉपी करा"}</span>
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-blue-100 text-[11px] leading-relaxed max-h-28 overflow-y-auto">
                    {socialCaptions.facebook}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MAIN ARTICLE FORM (Controlled Inputs + Server Action Submission) */}
      {/* ============================================================ */}
      <form action={createArticleAction} className="space-y-6 text-xs sm:text-sm">
        {initialData.draftId && (
          <input type="hidden" name="draftId" value={initialData.draftId} />
        )}

        {/* 1. TITLE (Headline) */}
        <div>
          <label className="block font-bold text-gray-900 mb-1">
            मुख्य शीर्षक (Headline / Title) *
          </label>
          <input
            type="text"
            name="headline"
            required
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="उदा. जामखेड शहराच्या पाणीपुरवठ्यासाठी नवीन जलवाहिनीचे काम सुरू"
            className="w-full text-base font-bold border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-red-700 focus:outline-none"
          />
        </div>

        {/* 2. SLUG */}
        <div>
          <label className="block font-bold text-gray-800 mb-1">
            URL स्लग (Slug)
          </label>
          <input
            type="text"
            name="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="उदा. jamkhed-water-pipeline-work-starts (रिक्त ठेवल्यास आपोआप जनरेट होईल)"
            className="w-full border border-gray-300 rounded-lg p-2.5 text-xs font-mono text-gray-800 focus:ring-2 focus:ring-red-700 focus:outline-none"
          />
        </div>

        {/* 3. CATEGORY */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
          <div className="flex items-center justify-between">
            <label className="block font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-red-700" />
              <span>बातमी विभाग (News Category) *</span>
            </label>
            <span className="text-[11px] text-gray-500">
              डेटाबेस मधील {categories.length} विभाग उपलब्ध
            </span>
          </div>
          <select
            name="categoryId"
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 text-xs sm:text-sm font-bold text-gray-900 bg-white focus:ring-2 focus:ring-red-700 focus:outline-none shadow-xs"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameMarathi} ({c.name})
              </option>
            ))}
          </select>
        </div>

        {/* 4. FEATURED IMAGE (Sharp Optimized Image Uploader) */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
          <FeaturedImageUploader
            initialImageUrl={initialData.featuredImage}
            value={featuredImage}
            onChange={(url) => setFeaturedImage(url)}
            name="featuredImage"
            label="मुख्य बातमी फोटो / कव्हर इमेज (Featured Image)"
          />
        </div>

        {/* 5. CONTENT: Subheadline, Summary & Body Markdown */}
        <div className="space-y-4">
          <div>
            <label className="block font-bold text-gray-800 mb-1">
              उपशीर्षक / देख (Subheadline / Dek)
            </label>
            <input
              type="text"
              name="subheadline"
              value={subheadline}
              onChange={(e) => setSubheadline(e.target.value)}
              placeholder="उदा. खर्डा चौक ते बीड नाका दरम्यान पाईपलाईन; पुढील १५ दिवसांत काम पूर्ण"
              className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 focus:ring-2 focus:ring-red-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-800 mb-1">
              बातमीचा महत्त्वाचा सारांश (Summary)
            </label>
            <textarea
              name="summary"
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="२ ते ३ वाक्यांत महत्त्वाचा निष्कर्ष किंवा बातमीचा गाभा..."
              className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 focus:ring-2 focus:ring-red-700 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-gray-900">
                सविस्तर बातमी मजकूर (Body Content) *
              </label>
              <span className="text-[11px] text-gray-400">
                मार्कडाउन (Headings, Bullets, Quotes, Bold) समर्थित
              </span>
            </div>
            <textarea
              name="bodyMarkdown"
              required
              rows={12}
              value={bodyMarkdown}
              onChange={(e) => setBodyMarkdown(e.target.value)}
              placeholder={`### मुख्य बातमी\n\nजामखेड (विशेष प्रतिनिधी): ...\n\n#### महत्त्वाचे मुद्दे:\n- पहिला मुद्दा\n- दुसरा मुद्दा\n\n> "प्रशासनाकडून आवश्यक सर्व मदत दिली जाईल." - तहसीलदार`}
              className="w-full font-mono text-xs sm:text-sm border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-red-700 focus:outline-none leading-relaxed"
            />
          </div>
        </div>

        {/* 6. LOCATION & REPORTER */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-800 mb-1">
              स्थान (Village / Location)
            </label>
            <select
              name="locationId"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-red-700 focus:outline-none"
            >
              <option value="">-- स्थान निवडा --</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.village} ({loc.taluka})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-800 mb-1">
              बातमीदार (Reporter / Author)
            </label>
            <select
              name="reporterId"
              value={reporterId}
              onChange={(e) => setReporterId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-red-700 focus:outline-none"
            >
              <option value="">न्यूज डेस्क (संपादकीय)</option>
              {reporters.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.nameMarathi} ({rep.designation})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 7. PRIORITY, BREAKING & VIDEO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-red-50 rounded-xl border border-red-200">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isBreaking"
                name="isBreaking"
                value="true"
                checked={isBreaking}
                onChange={(e) => setIsBreaking(e.target.checked)}
                className="w-4 h-4 accent-red-700"
              />
              <label htmlFor="isBreaking" className="font-black text-red-900 cursor-pointer">
                🚨 ब्रेकिंग न्यूज म्हणून दाखवा (Breaking News)
              </label>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <label className="font-bold text-gray-800">प्राधान्य (Priority 0-5):</label>
              <input
                type="number"
                name="priority"
                min="0"
                max="5"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-16 border border-gray-300 rounded p-1 text-center font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-800 mb-1 text-xs">
              YouTube व्हिडिओ लिंक (YouTube URL)
            </label>
            <input
              type="url"
              name="youtubeUrl"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-red-700 focus:outline-none"
            />
          </div>
        </div>

        {/* 8. TAGS / SEO METADATA */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-gray-700">
            SEO व सोशल मेटाडेटा (Tags & SEO)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                SEO Title (मेटा शीर्षक)
              </label>
              <input
                type="text"
                name="seoTitle"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="गूगल शोध परिणामांसाठी शीर्षक..."
                className="w-full border border-gray-300 rounded p-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                SEO Keywords (कीवर्ड्स - स्वल्पविरामाने वेगळे करा)
              </label>
              <input
                type="text"
                name="seoKeywords"
                value={seoKeywords}
                onChange={(e) => setSeoKeywords(e.target.value)}
                placeholder="उदा. जामखेड, पाणीपुरवठा, जलवाहिनी, बातमी"
                className="w-full border border-gray-300 rounded p-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              SEO Description (मेटा वर्णन)
            </label>
            <input
              type="text"
              name="seoDescription"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="सर्च इंजिन निकालाखाली दिसणारा मजकूर..."
              className="w-full border border-gray-300 rounded p-2 text-xs"
            />
          </div>
        </div>

        {/* 9. SUBMIT ACTIONS: SAVE DRAFT & PUBLISH */}
        <div className="pt-4 border-t border-gray-200 flex flex-wrap items-center justify-end gap-3">
          <button
            type="submit"
            name="status"
            value="DRAFT"
            className="flex items-center gap-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold px-4 py-2.5 rounded-xl transition-colors text-xs"
          >
            <Save className="w-4 h-4" />
            <span>मसुदा म्हणून सेव्ह करा (Save Draft)</span>
          </button>

          <button
            type="submit"
            name="status"
            value="SUBMITTED"
            className="flex items-center gap-1.5 bg-blue-800 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-xs shadow"
          >
            <Send className="w-4 h-4" />
            <span>संपादकांकडे पाठवा (Submit for Review)</span>
          </button>

          {userIsEditor && (
            <button
              type="submit"
              name="status"
              value="PUBLISHED"
              className="flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white font-bold px-6 py-2.5 rounded-xl transition-colors text-xs shadow"
            >
              <Globe className="w-4 h-4" />
              <span>थेट प्रसिद्ध करा (Publish Directly)</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

