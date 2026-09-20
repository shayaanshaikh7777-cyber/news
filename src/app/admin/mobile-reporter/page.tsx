"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createMobileReportAction } from "@/actions/article.actions";
import { uploadAndOptimizeMediaAction } from "@/actions/media.actions";
import {
  Mic,
  MicOff,
  Camera,
  Image as ImageIcon,
  MapPin,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Video,
  Upload,
  Trash2,
  RefreshCw,
  Rocket,
  Loader2,
  X,
  Globe,
  FileText,
  Edit3,
} from "lucide-react";

interface ISpeechRecognitionResult {
  transcript: string;
  confidence: number;
}

interface ISpeechRecognitionResultList {
  length: number;
  [index: number]: {
    length: number;
    [index: number]: ISpeechRecognitionResult;
    isFinal: boolean;
  };
}

interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: ISpeechRecognitionResultList;
}

interface ISpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface ISpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => ISpeechRecognitionInstance;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

export default function MobileReporterPage() {
  const router = useRouter();

  // Content mode: "raw" = "कच्च्या नोंदी", "draft" = "बातमीचा मसुदा"
  const [contentMode, setContentMode] = useState<"raw" | "draft">("raw");

  const [headline, setHeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState("जामखेड शहर");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  const [isMicOn, setIsMicOn] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("व्हॉइस इनपुट सुरू करा");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [aiProcessing, setAiProcessing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);

  // Single recognition instance and lifecycle controller refs
  const recognitionRef = useRef<ISpeechRecognitionInstance | null>(null);
  const isRecognitionRunningRef = useRef<boolean>(false);
  const shouldKeepListeningRef = useRef<boolean>(false);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Transcript state refs
  const finalTranscriptRef = useRef<string>("");
  const interimTranscriptRef = useRef<string>("");
  const baseNotesRef = useRef<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastCreatedArticleIdRef = useRef<string | null>(null);

  // Helper to safely start recognition with running guard
  const safeStartRecognition = () => {
    if (!recognitionRef.current) return;
    if (isRecognitionRunningRef.current) return;

    try {
      isRecognitionRunningRef.current = true;
      recognitionRef.current.start();
    } catch (err) {
      isRecognitionRunningRef.current = false;
      console.warn("SpeechRecognition start warning:", err);
      // If error occurred while shouldKeepListening is true, schedule clean restart
      if (shouldKeepListeningRef.current) {
        if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = setTimeout(() => {
          if (shouldKeepListeningRef.current && !isRecognitionRunningRef.current) {
            safeStartRecognition();
          }
        }, 200);
      }
    }
  };

  // Setup single recognition instance on mount
  useEffect(() => {
    const SR = getSpeechRecognitionConstructor();
    if (!SR) {
      setVoiceStatus("ब्राउझर व्हॉइस रेकग्निशन उपलब्ध नाही (मजकूर टाईप करा)");
      return;
    }

    const recognition = new SR();
    recognition.lang = "mr-IN"; // Marathi recognition
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      isRecognitionRunningRef.current = true;
      if (shouldKeepListeningRef.current) {
        setIsMicOn(true);
        setVoiceStatus("🔴 रेकॉर्डिंग सुरू आहे... स्पष्ट मराठीत बोला (थांबवण्यासाठी माईक बटण दाबा)");
      }
    };

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      if (!shouldKeepListeningRef.current) return;

      let interim = "";

      // Process ONLY new results beginning at event.resultIndex through event.results.length - 1
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";

        if (result.isFinal) {
          // Commit exactly once to finalTranscriptRef
          finalTranscriptRef.current += text + " ";
        } else {
          // Temporary only — replaces previous interim
          interim += text;
        }
      }

      interimTranscriptRef.current = interim;
      setInterimTranscript(interim);

      // Display: base text (prior to recording) + finalized transcript + current interim
      const base = baseNotesRef.current ? baseNotesRef.current.trim() : "";
      const finalPart = finalTranscriptRef.current.trim();
      const interimPart = interim.trim();

      let combined = base;
      if (finalPart) {
        combined = combined ? `${combined} ${finalPart}` : finalPart;
      }
      if (interimPart) {
        combined = combined ? `${combined} ${interimPart}` : interimPart;
      }

      setNotes(combined);
    };

    recognition.onerror = (e: ISpeechRecognitionErrorEvent) => {
      console.warn("Speech recognition error:", e.error);
      if (!shouldKeepListeningRef.current) return;

      if (e.error === "no-speech") {
        // Natural pause/silence — keep Mic ON, do NOT stop
        setVoiceStatus("बोलण्याची वाट पाहत आहे... (माईक सक्रिय आहे)");
        return;
      }

      if (e.error === "aborted") {
        // Normal during abort/stop or restart
        return;
      }

      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        shouldKeepListeningRef.current = false;
        isRecognitionRunningRef.current = false;
        setIsMicOn(false);
        setVoiceStatus("मायक्रोफोन परवानगी नाकारली गेली आहे. कृपया ब्राउझर सेटिंग्ज तपासा.");
        return;
      }
    };

    recognition.onend = () => {
      isRecognitionRunningRef.current = false;

      // Discard current interim transcript on end
      interimTranscriptRef.current = "";
      setInterimTranscript("");

      // Preserve finalized transcript
      const base = baseNotesRef.current ? baseNotesRef.current.trim() : "";
      const finalPart = finalTranscriptRef.current.trim();
      const finalizedCombined = base ? (finalPart ? `${base} ${finalPart}` : base) : finalPart;
      setNotes(finalizedCombined);

      // If user has Mic ON, safely restart recognition after pause
      if (shouldKeepListeningRef.current) {
        setVoiceStatus("🔴 रेकॉर्डिंग सुरू आहे... (सक्रिय)");
        if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = setTimeout(() => {
          if (shouldKeepListeningRef.current && !isRecognitionRunningRef.current) {
            safeStartRecognition();
          }
        }, 150);
      } else {
        // User turned mic OFF: remain OFF
        setIsMicOn(false);
        setVoiceStatus("व्हॉइस रेकॉर्डिंग थांबवले");
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldKeepListeningRef.current = false;
      isRecognitionRunningRef.current = false;
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  // Independent manual Mic toggle (OFF -> ON, ON -> OFF)
  const handleMicToggle = () => {
    if (isMicOn || shouldKeepListeningRef.current) {
      // 1. Set shouldKeepListeningRef = false
      shouldKeepListeningRef.current = false;
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }

      // 2. Stop/abort recognition
      if (recognitionRef.current && isRecognitionRunningRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      isRecognitionRunningRef.current = false;

      // 3. Clear interim transcript & preserve final transcript
      interimTranscriptRef.current = "";
      setInterimTranscript("");

      const base = baseNotesRef.current ? baseNotesRef.current.trim() : "";
      const finalPart = finalTranscriptRef.current.trim();
      const finalizedCombined = base ? (finalPart ? `${base} ${finalPart}` : base) : finalPart;

      setNotes(finalizedCombined);
      baseNotesRef.current = finalizedCombined;
      finalTranscriptRef.current = "";

      // 4. Set UI Mic OFF
      setIsMicOn(false);
      setVoiceStatus("व्हॉइस रेकॉर्डिंग थांबवले");
    } else {
      // Turn MIC ON
      const SR = getSpeechRecognitionConstructor();
      if (!SR) {
        alert("आपला ब्राउझर थेट स्पीच-टू-टेक्स्टला सपोर्ट करत नाही. कृपया मजकूर टाईप करा.");
        return;
      }

      // 1. Keep existing final transcript (as base for this session)
      baseNotesRef.current = notes.trim();
      finalTranscriptRef.current = "";

      // 2. Clear stale interim transcript
      interimTranscriptRef.current = "";
      setInterimTranscript("");

      // 3. Set shouldKeepListeningRef = true
      shouldKeepListeningRef.current = true;

      // 4. Set UI Mic ON
      setIsMicOn(true);
      setVoiceStatus("🔴 रेकॉर्डिंग सुरू आहे... स्पष्ट मराठीत बोला (थांबवण्यासाठी माईक बटण दाबा)");

      // 5. Start recognition exactly once
      safeStartRecognition();
    }
  };

  // Content mode selection handler: forces Mic OFF on switch
  const handleModeChange = (newMode: "raw" | "draft") => {
    if (newMode === contentMode) return;

    // If Mic is currently ON, safely turn it OFF and preserve finalized transcript
    if (isMicOn || shouldKeepListeningRef.current) {
      // 1. Stop/abort recognition safely
      // 2. Prevent onend auto-restart
      shouldKeepListeningRef.current = false;
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }

      if (recognitionRef.current && isRecognitionRunningRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
      isRecognitionRunningRef.current = false;

      // 3. Preserve finalized transcript & 4. Discard only current interim transcript
      interimTranscriptRef.current = "";
      setInterimTranscript("");

      const base = baseNotesRef.current ? baseNotesRef.current.trim() : "";
      const finalPart = finalTranscriptRef.current.trim();
      const finalizedCombined = base ? (finalPart ? `${base} ${finalPart}` : base) : finalPart;

      setNotes(finalizedCombined);
      baseNotesRef.current = finalizedCombined;
      finalTranscriptRef.current = "";

      // 5. Set Mic OFF
      setIsMicOn(false);
      setVoiceStatus("मोड बदलल्यामुळे माईक थांबवला आहे (पुन्हा बोलण्यासाठी माईक बटण दाबा)");
    }

    // 6. Switch mode
    setContentMode(newMode);
  };

  // AI cleanup and auto-drafting
  const handleAICleanup = async () => {
    if (!notes.trim()) {
      alert("कृपया आधी व्हॉइस रेकॉर्डिंग करा किंवा कच्च्या नोंदी टाईप करा.");
      return;
    }

    setAiProcessing(true);
    setMessage("");
    setErrorMessage("");

    try {
      const res = await fetch("/api/ai/studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes,
          location,
          language: "marathi",
          action: "GENERATE_ARTICLE",
        }),
      });

      const json = await res.json();
      if (res.ok && json.data) {
        setHeadline(json.data.headline);
        setNotes(json.data.body_markdown);
        baseNotesRef.current = json.data.body_markdown;
        finalTranscriptRef.current = "";
        setMessage("✅ AI द्वारे बातमीचा मसुदा तयार झाला आहे!");
      } else {
        setErrorMessage(json.error || "AI मसुदा तयार करताना त्रुटी आली.");
      }
    } catch {
      setErrorMessage("AI प्रक्रिया करताना तांत्रिक अडचण आली.");
    } finally {
      setAiProcessing(false);
    }
  };

  // Photo upload using uploadAndOptimizeMediaAction
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert("कृपया 25 MB पेक्षा कमी आकाराची इमेज निवडा.");
      return;
    }

    setUploadingPhoto(true);
    setMessage("");
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("format", "webp");
      formData.append("altText", headline || `मोबाइल बातमी फोटो - ${location}`);

      const res = await uploadAndOptimizeMediaAction(formData);
      if (res.success && res.assets && res.assets.length > 0) {
        setPhotoUrl(res.assets[0].url);
        setMessage("✅ फोटो यशस्वीरीत्या अपलोड व ऑप्टिमाइझ झाला!");
      } else {
        setErrorMessage(res.message || "फोटो अपलोड करताना त्रुटी आली.");
      }
    } catch (err) {
      console.error("Photo upload error:", err);
      setErrorMessage("फोटो अपलोड करताना तांत्रिक अडचण आली.");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Submit report handler (handles both Editor Submission and Direct Publish)
  const submitReport = async (directPublish: boolean) => {
    if (!headline.trim() || !notes.trim()) {
      alert("कृपया बातमीचे शीर्षक आणि मजकूर दोन्ही भरा.");
      return;
    }

    // Stop recording if active before submitting
    if (isMicOn || shouldKeepListeningRef.current) {
      handleMicToggle();
    }

    setSubmitting(true);
    setMessage("");
    setErrorMessage("");

    try {
      const res = await createMobileReportAction({
        articleId: lastCreatedArticleIdRef.current || undefined,
        headline: headline.trim(),
        notes: notes.trim(),
        photoUrl: photoUrl.trim() || undefined,
        youtubeUrl: youtubeUrl.trim() || undefined,
        locationName: location,
        directPublish,
      });

      if (res.success) {
        if (res.articleId) {
          lastCreatedArticleIdRef.current = res.articleId;
        }

        if (directPublish) {
          setMessage("🚀 बातमी पोर्टलवर थेट प्रसिद्ध (Live) झाली आहे!");
        } else {
          setMessage("✅ बातमी यशस्वीरीत्या मुख्य संपादकांकडे पुनरावलोकनासाठी पाठवली गेली आहे!");
        }

        setTimeout(() => {
          router.push("/admin/articles");
        }, 1800);
      } else {
        setErrorMessage(res.error || "सबमिट करताना त्रुटी आली.");
      }
    } catch (err) {
      console.error("Submit report error:", err);
      setErrorMessage("बातमी पाठवताना तांत्रिक त्रुटी आली.");
    } finally {
      setSubmitting(false);
      setShowPublishModal(false);
    }
  };

  const handleSubmitToEditor = (e: React.FormEvent) => {
    e.preventDefault();
    submitReport(false);
  };

  const handleDirectPublishClick = () => {
    if (!headline.trim() || !notes.trim()) {
      alert("कृपया बातमीचे शीर्षक आणि मजकूर दोन्ही भरा.");
      return;
    }
    setShowPublishModal(true);
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 font-marathi pb-10">
      {/* Mobile Reporter Masthead */}
      <div className="bg-red-950 text-white p-5 rounded-2xl border border-red-800 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black tracking-widest text-red-300 uppercase block">
            फील्ड रिपोर्टर मोड (Ground Reporting)
          </span>
          <h1 className="text-xl font-black font-headline mt-0.5">
            + New Report (थेट वार्तांकन)
          </h1>
        </div>

        <div className="w-10 h-10 rounded-full bg-red-800 flex items-center justify-center text-white shadow-inner">
          <Camera className="w-5 h-5" />
        </div>
      </div>

      {/* Success Notification */}
      {message && (
        <div className="p-3.5 bg-green-50 text-green-900 border border-green-200 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="p-3.5 bg-red-50 text-red-900 border border-red-200 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Voice-to-News Card */}
      <div className="bg-gradient-to-br from-red-900 via-red-800 to-red-900 text-white p-5 rounded-2xl shadow-md text-center">
        {/* Content Mode Selection */}
        <div className="flex items-center justify-center gap-2 mb-3.5 bg-red-950/60 p-1 rounded-xl border border-red-700/50 max-w-xs mx-auto">
          <button
            type="button"
            onClick={() => handleModeChange("raw")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
              contentMode === "raw"
                ? "bg-white text-red-950 shadow"
                : "text-red-200 hover:text-white"
            }`}
          >
            📝 कच्च्या नोंदी
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("draft")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
              contentMode === "draft"
                ? "bg-white text-red-950 shadow"
                : "text-red-200 hover:text-white"
            }`}
          >
            📰 बातमीचा मसुदा
          </button>
        </div>

        <p className="text-xs text-red-200 font-semibold mb-3">
          {contentMode === "raw"
            ? "व्हॉइस-टू-टेक्स्ट (कच्च्या नोंदी मोड)"
            : "व्हॉइस-टू-न्यूज (बातमीचा मसुदा मोड)"}
        </p>

        {/* Independent Microphone Toggle */}
        <button
          type="button"
          onClick={handleMicToggle}
          title={isMicOn ? "माईक बंद करा" : "माईक सुरू करा"}
          className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
            isMicOn
              ? "bg-red-500 ring-4 ring-red-300 animate-pulse text-white"
              : "bg-white text-red-900 hover:bg-gray-100"
          }`}
        >
          {isMicOn ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
        </button>

        <p className="text-xs font-bold text-white mt-3">{voiceStatus}</p>

        {/* Live speech interim preview */}
        {interimTranscript && (
          <div className="mt-2.5 px-3 py-1.5 bg-red-950/70 border border-red-700/50 rounded-lg text-xs text-yellow-200 italic max-h-16 overflow-y-auto">
            🔴 ऐकत आहे: &ldquo;{interimTranscript}&rdquo;
          </div>
        )}

        <p className="text-[11px] text-red-200 mt-1.5">
          मराठी, हिंदी किंवा इंग्रजीत बोला — तुम्ही विचार करताना थांबला तरी माईक चालू राहील.
        </p>

        {/* AI Cleanup button */}
        <button
          type="button"
          onClick={handleAICleanup}
          disabled={aiProcessing}
          className="mt-4 inline-flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-gray-950 font-black px-4 py-2 rounded-xl text-xs shadow transition-all disabled:opacity-60"
        >
          {aiProcessing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>AI प्रक्रिया करत आहे...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI क्लीनअप व ड्राफ्ट बनवा</span>
            </>
          )}
        </button>
      </div>

      {/* Quick Field Report Form */}
      <form
        onSubmit={handleSubmitToEditor}
        className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4 text-xs sm:text-sm"
      >
        {/* Headline */}
        <div>
          <label className="block font-bold text-gray-800 mb-1">
            बातमीचे शीर्षक (Headline): <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            required
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="उदा. खर्डा येथे अचानक वीज पुरवठा खंडित, व्यापारी आक्रमक"
            className="w-full border border-gray-300 rounded-lg p-2.5 font-bold text-gray-900 focus:ring-2 focus:ring-red-700 focus:outline-none"
          />
        </div>

        {/* Location Selector */}
        <div>
          <label className="block font-bold text-gray-800 mb-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-red-700" />
            <span>घटनेचे स्थान (Village / Location):</span>
          </label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2.5 font-semibold text-gray-800 bg-gray-50 focus:ring-2 focus:ring-red-700 focus:outline-none"
          >
            <option value="जामखेड शहर">जामखेड शहर</option>
            <option value="खर्डा">खर्डा</option>
            <option value="चोंडी">चोंडी</option>
            <option value="हळगाव">हळगाव</option>
            <option value="नानज">नानज</option>
            <option value="सावरगाव">सावरगाव</option>
            <option value="जवळके">जवळके</option>
            <option value="राजुरी">राजुरी</option>
            <option value="मोहा">मोहा</option>
            <option value="साकत">साकत</option>
            <option value="दिघोळ">दिघोळ</option>
            <option value="कर्जत शहर">कर्जत शहर</option>
            <option value="राशीन">राशीन</option>
          </select>
        </div>

        {/* Notes / Body */}
        <div>
          <label className="block font-bold text-gray-800 mb-1">
            {contentMode === "raw" ? "कच्च्या नोंदी:" : "बातमीचा मसुदा:"}{" "}
            <span className="text-red-600">*</span>
          </label>
          <textarea
            rows={6}
            required
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              baseNotesRef.current = e.target.value;
              finalTranscriptRef.current = "";
            }}
            placeholder={
              contentMode === "raw"
                ? "घटनेचा तपशील, प्रत्यक्षदर्शींची नावे, वेळ आणि महत्त्वाचे मुद्दे (कच्च्या नोंदी)..."
                : "बातमीचा मसुदा किंवा तपशील..."
            }
            className="w-full border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900 focus:ring-2 focus:ring-red-700 focus:outline-none leading-relaxed"
          />
        </div>

        {/* Photo Upload & Preview Section */}
        <div className="space-y-2">
          <label className="block font-bold text-gray-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-red-700" />
              <span>घटनेचा फोटो (Photo / Camera):</span>
            </span>
            <button
              type="button"
              onClick={() => setShowManualUrl((prev) => !prev)}
              className="text-[11px] font-semibold text-red-700 hover:underline flex items-center gap-1"
            >
              <Globe className="w-3 h-3" />
              <span>{showManualUrl ? "URL लपवा" : "URL टाका"}</span>
            </button>
          </label>

          {/* Hidden File Input supporting mobile camera & gallery */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />

          {/* Compact Photo Preview Card */}
          {photoUrl ? (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-3">
              <img
                src={photoUrl}
                alt="अपलोड केलेला फोटो"
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-gray-300 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>फोटो तयार आहे</span>
                </div>
                <p className="text-[11px] text-gray-500 truncate" title={photoUrl}>
                  {photoUrl}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-300 rounded-lg text-[11px] font-bold text-gray-700 hover:bg-gray-100 transition shadow-xs"
                  >
                    <RefreshCw className="w-3 h-3 text-gray-600" />
                    <span>फोटो बदला</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={uploadingPhoto}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-red-200 rounded-lg text-[11px] font-bold text-red-600 hover:bg-red-50 transition shadow-xs"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>फोटो काढा</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="flex-1 py-3 px-4 bg-red-50 hover:bg-red-100 text-red-900 border border-red-200 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-60"
              >
                {uploadingPhoto ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-red-700" />
                    <span>फोटो अपलोड होत आहे...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 text-red-700" />
                    <span>📷 फोटो अपलोड करा (कॅमेरा / गॅलरी)</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Manual URL Input Option */}
          {showManualUrl && (
            <div className="pt-1">
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://... किंवा वेब फोटो लिंक टाका"
                className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-red-700 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* YouTube Video URL */}
        <div>
          <label className="block font-bold text-gray-800 mb-1 flex items-center gap-1.5">
            <Video className="w-4 h-4 text-red-700" />
            <span>थेट व्हिडिओ लिंक (YouTube / Shorts):</span>
          </label>
          <input
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://youtube.com/..."
            className="w-full border border-gray-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-red-700 focus:outline-none"
          />
        </div>

        {/* Action Buttons: Submit to Editor + Direct Publish */}
        <div className="pt-3 space-y-2.5">
          {/* Submit to Editor */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-red-800 hover:bg-red-700 text-white font-black py-3 rounded-xl transition-all shadow-md text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99]"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>सादर करत आहे...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>✈️ संपादकांकडे सादर करा (Submit to Editor)</span>
              </>
            )}
          </button>

          {/* Direct Publish Button */}
          <button
            type="button"
            onClick={handleDirectPublishClick}
            disabled={submitting}
            className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-black py-3 rounded-xl transition-all shadow-md text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99]"
          >
            <Rocket className="w-4 h-4" />
            <span>🚀 थेट प्रसिद्ध करा (Direct Publish)</span>
          </button>
        </div>
      </form>

      {/* Direct Publish Confirmation Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <Rocket className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-gray-900">
                थेट बातमी प्रसिद्धी (Direct Publish)
              </h3>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                हा रिपोर्ट थेट प्रसिद्ध करायचा आहे का? ही बातमी पोर्टलवर तात्काळ सर्व वाचकांसाठी प्रसिद्ध (Live) होईल.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                disabled={submitting}
                className="flex-1 py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-xs transition"
              >
                रद्द करा
              </button>
              <button
                type="button"
                onClick={() => submitReport(true)}
                disabled={submitting}
                className="flex-1 py-2.5 px-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs transition shadow flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>प्रसिद्ध करत आहे...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>होय, प्रसिद्ध करा</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
