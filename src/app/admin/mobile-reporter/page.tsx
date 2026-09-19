"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";

export default function MobileReporterPage() {
  const router = useRouter();

  const [headline, setHeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState("जामखेड");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  const [isRecording, setIsRecording] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("व्हॉइस इनपुट सुरू करा");
  const [aiProcessing, setAiProcessing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // Web Speech API for voice-to-news in Marathi/Hindi
  useEffect(() => {
    // Check speech recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceStatus("ब्राउझर व्हॉइस रेकग्निशन उपलब्ध नाही");
    }
  }, []);

  const toggleVoiceRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("आपला ब्राउझर थेट स्पीच-टू-टेक्स्टला सपोर्ट करत नाही. कृपया मजकूर टाईप करा.");
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      setVoiceStatus("व्हॉइस रेकॉर्डिंग थांबवले");
    } else {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = "mr-IN"; // Marathi recognition
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => {
          setIsRecording(true);
          setVoiceStatus("🔴 रेकॉर्डिंग सुरू आहे... स्पष्ट मराठीत बोला");
        };

        recognition.onresult = (event: any) => {
          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setNotes((prev) => `${prev} ${transcript}`.trim());
        };

        recognition.onerror = (e: any) => {
          console.error("Speech recognition error:", e);
          setIsRecording(false);
          setVoiceStatus("व्हॉइस इनपुट थांबले");
        };

        recognition.onend = () => {
          setIsRecording(false);
          setVoiceStatus("व्हॉइस इनपुट पूर्ण झाले");
        };

        recognition.start();
      } catch (err) {
        console.error(err);
        setIsRecording(false);
      }
    }
  };

  const handleAICleanup = async () => {
    if (!notes.trim()) {
      alert("कृपया आधी व्हॉइस रेकॉर्डिंग करा किंवा कच्च्या नोंदी टाईप करा.");
      return;
    }

    setAiProcessing(true);
    setMessage("");

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
        setMessage("✅ AI द्वारे बातमीचा मसुदा तयार झाला आहे!");
      }
    } catch {
      alert("AI प्रक्रिया करताना त्रुटी आली.");
    } finally {
      setAiProcessing(false);
    }
  };

  const handleSubmitToEditor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headline.trim() || !notes.trim()) {
      alert("कृपया बातमीचे शीर्षक आणि मजकूर दोन्ही भरा.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("headline", headline);
      formData.append("bodyMarkdown", notes);
      formData.append("summary", headline);
      formData.append("featuredImage", photoUrl);
      formData.append("youtubeUrl", youtubeUrl);
      formData.append("categoryId", "cm7x111111111111111111111"); // Fallback
      formData.append("status", "SUBMITTED");

      // Submit
      const res = await fetch("/admin/articles/new", {
        method: "POST",
        body: formData,
      });

      setMessage("✅ बातमी यशस्वीरीत्या मुख्य संपादकांकडे पुनरावलोकनासाठी पाठवली गेली आहे!");
      setTimeout(() => {
        router.push("/admin/articles");
      }, 2000);
    } catch {
      setMessage("सबमिट करताना त्रुटी आली.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 font-marathi">
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

        <div className="w-10 h-10 rounded-full bg-red-800 flex items-center justify-center text-white">
          <Camera className="w-5 h-5" />
        </div>
      </div>

      {message && (
        <div className="p-3 bg-green-50 text-green-900 border border-green-200 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Voice-to-News Card */}
      <div className="bg-gradient-to-br from-red-900 via-red-800 to-red-900 text-white p-5 rounded-2xl shadow-md text-center">
        <p className="text-xs text-red-200 font-semibold mb-2">
          व्हॉइस-टू-न्यूज (Voice-to-News Pipeline):
        </p>

        <button
          type="button"
          onClick={toggleVoiceRecording}
          className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
            isRecording
              ? "bg-red-500 animate-ping ring-4 ring-white"
              : "bg-white text-red-900 hover:bg-gray-100"
          }`}
        >
          {isRecording ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
        </button>

        <p className="text-xs font-bold text-white mt-3">{voiceStatus}</p>
        <p className="text-[11px] text-red-200 mt-0.5">
          मराठी, हिंदी किंवा इंग्रजीत बोला — AI आपोआप बातमी तयार करेल.
        </p>

        <button
          type="button"
          onClick={handleAICleanup}
          disabled={aiProcessing}
          className="mt-4 inline-flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-gray-950 font-black px-4 py-2 rounded-xl text-xs shadow transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{aiProcessing ? "AI प्रक्रिया करत आहे..." : "AI क्लीनअप व ड्राफ्ट बनवा"}</span>
        </button>
      </div>

      {/* Quick Field Report Form */}
      <form
        onSubmit={handleSubmitToEditor}
        className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4 text-xs sm:text-sm"
      >
        <div>
          <label className="block font-bold text-gray-800 mb-1">
            बातमीचे शीर्षक (Headline):
          </label>
          <input
            type="text"
            required
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="उदा. खर्डा येथे अचानक वीज पुरवठा खंडित, व्यापारी आक्रमक"
            className="w-full border border-gray-300 rounded-lg p-2.5 font-bold text-gray-900 focus:ring-2 focus:ring-red-700"
          />
        </div>

        <div>
          <label className="block font-bold text-gray-800 mb-1">
            घटनेचे स्थान (Village / Location):
          </label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2.5 font-semibold text-gray-800 bg-gray-50"
          >
            <option value="जामखेड शहर">जामखेड शहर</option>
            <option value="खर्डा">खर्डा</option>
            <option value="चोंडी">चोंडी</option>
            <option value="हळगाव">हळगाव</option>
            <option value="नानज">नानज</option>
            <option value="सावरगाव">सावरगाव</option>
            <option value="जवळके">जवळके</option>
            <option value="कर्जत">कर्जत</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-gray-800 mb-1">
            कच्च्या नोंदी किंवा बातमीचा मसुदा:
          </label>
          <textarea
            rows={6}
            required
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="घटनेचा तपशील, प्रत्यक्षदर्शींची नावे, वेळ आणि महत्त्वाचे मुद्दे..."
            className="w-full border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900 focus:ring-2 focus:ring-red-700 leading-relaxed"
          />
        </div>

        {/* Camera / Photo URL Input */}
        <div>
          <label className="block font-bold text-gray-800 mb-1">
            घटनेचा फोटो (Photo URL / Camera):
          </label>
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://... किंवा कॅमेऱ्याने घेतलेला फोटो"
              className="flex-1 border border-gray-300 rounded-lg p-2 text-xs"
            />
          </div>
        </div>

        {/* YouTube Video URL */}
        <div>
          <label className="block font-bold text-gray-800 mb-1">
            थेट व्हिडिओ लिंक (YouTube / Shorts):
          </label>
          <input
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://youtube.com/..."
            className="w-full border border-gray-300 rounded-lg p-2 text-xs"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-red-800 hover:bg-red-700 text-white font-black py-3 rounded-xl transition-all shadow-md text-sm flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          <span>{submitting ? "सादर करत आहे..." : "संपादकांकडे सादर करा (Submit to Editor)"}</span>
        </button>
      </form>
    </div>
  );
}

