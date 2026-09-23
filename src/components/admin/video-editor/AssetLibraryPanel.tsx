"use client";

import React, { useState, useRef } from "react";
import {
  VideoTrackId,
  AudioTrackId,
  GraphicType,
  VideoTemplateId,
  VideoClipItem,
  GraphicOverlayItem,
  AudioClipItem,
} from "@/types/video-studio";
import { VIDEO_TEMPLATES } from "@/lib/video-editor/templates";
import { GRAPHIC_TYPE_DEFINITIONS } from "@/lib/video-editor/graphics";
import { DEFAULT_ELEVENLABS_VOICES } from "@/lib/video-editor/voices";
import {
  Film,
  Newspaper,
  Type,
  Mic,
  Music,
  LayoutTemplate,
  Upload,
  Plus,
  Play,
  Pause,
  Sparkles,
  StopCircle,
  FileText,
  Volume2,
  Check,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";

interface PublishedArticleMeta {
  id: string;
  title: string;
  excerpt?: string;
  featuredImage?: string | null;
  categoryName?: string;
  authorName?: string;
}

interface AssetLibraryPanelProps {
  articles: PublishedArticleMeta[];
  currentTime: number;
  onAddClip: (clip: Omit<VideoClipItem, "id">) => void;
  onAddGraphic: (graphic: Omit<GraphicOverlayItem, "id">) => void;
  onAddAudio: (audio: Omit<AudioClipItem, "id">) => void;
  onPreviewInSource: (url: string, title: string) => void;
  onApplyTemplate: (templateId: VideoTemplateId) => void;
  onGenerateFromArticle: (articleId: string) => Promise<void>;
}

type TabKey = "footage" | "articles" | "graphics" | "voice" | "music" | "templates";

export default function AssetLibraryPanel({
  articles,
  currentTime,
  onAddClip,
  onAddGraphic,
  onAddAudio,
  onPreviewInSource,
  onApplyTemplate,
  onGenerateFromArticle,
}: AssetLibraryPanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("footage");

  // Local footage assets
  const [footageAssets, setFootageAssets] = useState<
    Array<{ url: string; title: string; mediaType: "video" | "image"; duration: number }>
  >([
    {
      url: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1280&q=80",
      title: "स्थानिक वृत्त वार्तांकन (News Gathering)",
      mediaType: "image",
      duration: 5,
    },
    {
      url: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1280&q=80",
      title: "पत्रकार परिषद व मुलाखत (Press Conference)",
      mediaType: "image",
      duration: 5,
    },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ElevenLabs Voice State
  const [ttsText, setTtsText] = useState<string>("जामखेड शहरात आज मोठी घटना घडली. प्रशासनाने तात्काळ दखल घेतली आहे.");
  const [selectedVoice, setSelectedVoice] = useState<string>(DEFAULT_ELEVENLABS_VOICES[0].voiceId);
  const [isGeneratingTts, setIsGeneratingTts] = useState<boolean>(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [ttsDuration, setTtsDuration] = useState<number>(5);
  const [ttsError, setTtsError] = useState<string | null>(null);

  // Field Reporter Audio Mic Recorder
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedDuration, setRecordedDuration] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Article AI generation state
  const [generatingArticleId, setGeneratingArticleId] = useState<string | null>(null);

  // Background Music tracks
  const presetMusicTracks = [
    {
      title: "ब्रेकिंग न्यूज स्टिंगर (Breaking News Stinger)",
      url: "https://actions.google.com/sounds/v1/emergency/emergency_siren_short_burst.ogg",
      duration: 15,
    },
    {
      title: "गंभीर प्रादेशिक बातमी (Dramatic News Ambience)",
      url: "https://actions.google.com/sounds/v1/ambiences/humming_room_tone.ogg",
      duration: 30,
    },
    {
      title: "शांत मुलाखत पार्श्वसंगीत (Subtle Acoustic)",
      url: "https://actions.google.com/sounds/v1/weather/light_rain_on_car_roof.ogg",
      duration: 45,
    },
  ];

  // Handle local media file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const objectUrl = URL.createObjectURL(file);
      const isVideo = file.type.startsWith("video");
      const title = file.name.replace(/\.[^/.]+$/, "");

      setFootageAssets((prev) => [
        {
          url: objectUrl,
          title,
          mediaType: isVideo ? "video" : "image",
          duration: isVideo ? 10 : 5,
        },
        ...prev,
      ]);
    }
  };

  // Generate Voice via API
  const handleGenerateVoice = async () => {
    if (!ttsText.trim()) return;
    setIsGeneratingTts(true);
    setTtsError(null);

    try {
      const res = await fetch("/api/admin/video-editor/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: ttsText,
          voiceId: selectedVoice,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "व्हॉइस तयार करताना त्रुटी आली.");
      }

      setGeneratedAudioUrl(data.audioUrl);
      setTtsDuration(data.durationSeconds || 5);
    } catch (err: unknown) {
      setTtsError((err as Error).message);
    } finally {
      setIsGeneratingTts(false);
    }
  };

  // Reporter Mic Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mr.start();
      setIsRecording(true);
      setRecordedDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordedDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert("मायक्रोफोन परवानगी नाकारली किंवा उपलब्ध नाही.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-800 text-gray-200">
      {/* Tab Navigation Strip */}
      <div className="grid grid-cols-6 border-b border-gray-800 bg-gray-950 p-1 gap-1 text-[11px] font-bold">
        <button
          onClick={() => setActiveTab("footage")}
          className={`py-2 px-1 rounded flex flex-col items-center gap-1 transition ${
            activeTab === "footage" ? "bg-red-900 text-white shadow" : "text-gray-400 hover:text-gray-200"
          }`}
          title="व्हिडिओ व छायाचित्रे"
        >
          <Film className="w-4 h-4" />
          <span className="truncate">फुटेज</span>
        </button>

        <button
          onClick={() => setActiveTab("articles")}
          className={`py-2 px-1 rounded flex flex-col items-center gap-1 transition ${
            activeTab === "articles" ? "bg-red-900 text-white shadow" : "text-gray-400 hover:text-gray-200"
          }`}
          title="बातम्यातून व्हिडिओ बनवा"
        >
          <Newspaper className="w-4 h-4" />
          <span className="truncate">बातमी</span>
        </button>

        <button
          onClick={() => setActiveTab("graphics")}
          className={`py-2 px-1 rounded flex flex-col items-center gap-1 transition ${
            activeTab === "graphics" ? "bg-red-900 text-white shadow" : "text-gray-400 hover:text-gray-200"
          }`}
          title="लोअर थर्ड व ग्राफिक घटक"
        >
          <Type className="w-4 h-4" />
          <span className="truncate">ग्राफिक्स</span>
        </button>

        <button
          onClick={() => setActiveTab("voice")}
          className={`py-2 px-1 rounded flex flex-col items-center gap-1 transition ${
            activeTab === "voice" ? "bg-red-900 text-white shadow" : "text-gray-400 hover:text-gray-200"
          }`}
          title="ElevenLabs AI व्हॉइस व वार्ताहर माईक"
        >
          <Mic className="w-4 h-4" />
          <span className="truncate">व्हॉइस</span>
        </button>

        <button
          onClick={() => setActiveTab("music")}
          className={`py-2 px-1 rounded flex flex-col items-center gap-1 transition ${
            activeTab === "music" ? "bg-red-900 text-white shadow" : "text-gray-400 hover:text-gray-200"
          }`}
          title="न्यूज पार्श्वसंगीत व स्टिंगर्स"
        >
          <Music className="w-4 h-4" />
          <span className="truncate">संगीत</span>
        </button>

        <button
          onClick={() => setActiveTab("templates")}
          className={`py-2 px-1 rounded flex flex-col items-center gap-1 transition ${
            activeTab === "templates" ? "bg-red-900 text-white shadow" : "text-gray-400 hover:text-gray-200"
          }`}
          title="१० रेडिमेड न्यूज पॅकेजेस"
        >
          <LayoutTemplate className="w-4 h-4" />
          <span className="truncate">टेम्पलेट्स</span>
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-3 text-xs space-y-3">
        {/* 1. FOOTAGE TAB */}
        {activeTab === "footage" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-200">व्हिडिओ व छायाचित्रे</span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-2.5 py-1 bg-red-700 hover:bg-red-600 text-white rounded font-medium shadow-sm transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>अपलोड</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="video/*,image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-1 gap-2">
              {footageAssets.map((asset, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-gray-800 rounded border border-gray-700 flex flex-col gap-2 hover:border-gray-500 transition"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-12 bg-black rounded overflow-hidden flex-shrink-0 relative group">
                      {asset.mediaType === "image" ? (
                        <img src={asset.url} alt={asset.title} className="w-full h-full object-cover" />
                      ) : (
                        <video src={asset.url} className="w-full h-full object-cover" />
                      )}
                      <button
                        onClick={() => onPreviewInSource(asset.url, asset.title)}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        title="सोर्स मॉनिटरमध्ये पहा"
                      >
                        <Play className="w-4 h-4 text-white fill-white" />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-200 truncate">{asset.title}</p>
                      <span className="text-[10px] text-gray-400 capitalize">
                        {asset.mediaType} • {asset.duration} सेकंद
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-gray-700/60">
                    <button
                      onClick={() =>
                        onAddClip({
                          trackId: "V1",
                          assetUrl: asset.url,
                          title: asset.title,
                          startTime: currentTime,
                          duration: asset.duration,
                          sourceIn: 0,
                          sourceOut: asset.duration,
                          speed: 1,
                          volume: 100,
                          mute: false,
                          opacity: 1,
                          scale: 1,
                          positionX: 0,
                          positionY: 0,
                          rotation: 0,
                          brightness: 100,
                          contrast: 100,
                          saturation: 100,
                          mediaType: asset.mediaType,
                        })
                      }
                      className="px-2 py-1 rounded bg-red-950 hover:bg-red-900 text-red-200 border border-red-800 text-[10px] font-bold text-center"
                    >
                      + V1 मुख्य दृश्य
                    </button>
                    <button
                      onClick={() =>
                        onAddClip({
                          trackId: "V2",
                          assetUrl: asset.url,
                          title: `B-Roll: ${asset.title}`,
                          startTime: currentTime,
                          duration: asset.duration,
                          sourceIn: 0,
                          sourceOut: asset.duration,
                          speed: 1,
                          volume: 0,
                          mute: true,
                          opacity: 0.9,
                          scale: 1,
                          positionX: 0,
                          positionY: 0,
                          rotation: 0,
                          brightness: 100,
                          contrast: 100,
                          saturation: 100,
                          mediaType: asset.mediaType,
                        })
                      }
                      className="px-2 py-1 rounded bg-orange-950 hover:bg-orange-900 text-orange-200 border border-orange-800 text-[10px] font-bold text-center"
                    >
                      + V2 बी-रोल
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. ARTICLES TO VIDEO TAB */}
        {activeTab === "articles" && (
          <div className="space-y-3">
            <div>
              <span className="font-bold text-gray-200">प्रकाशित बातम्या</span>
              <p className="text-[11px] text-gray-400">
                कोणत्याही बातमीवरून १-क्लिकमध्ये बातमीदार स्क्रिप्ट, मथळा व टिकर तयार करा.
              </p>
            </div>

            <div className="space-y-2">
              {articles.length === 0 ? (
                <div className="p-4 text-center text-gray-400 border border-dashed border-gray-800 rounded">
                  कोणतीही प्रकाशित बातमी सापडली नाही.
                </div>
              ) : (
                articles.map((art) => {
                  const isGen = generatingArticleId === art.id;

                  return (
                    <div
                      key={art.id}
                      className="p-2.5 bg-gray-800 rounded border border-gray-700 flex flex-col gap-2 hover:border-gray-500 transition"
                    >
                      <div className="flex items-start gap-2">
                        {art.featuredImage ? (
                          <img
                            src={art.featuredImage}
                            alt=""
                            className="w-14 h-12 object-cover rounded flex-shrink-0 bg-black"
                          />
                        ) : (
                          <div className="w-14 h-12 bg-gray-900 rounded flex items-center justify-center flex-shrink-0 text-gray-600">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-gray-100 text-xs line-clamp-2 leading-snug">{art.title}</p>
                          <span className="text-[10px] text-red-400 font-semibold">{art.categoryName || "बातमी"}</span>
                        </div>
                      </div>

                      <button
                        disabled={isGen}
                        onClick={async () => {
                          setGeneratingArticleId(art.id);
                          await onGenerateFromArticle(art.id);
                          setGeneratingArticleId(null);
                        }}
                        className="w-full py-1.5 px-3 rounded bg-gradient-to-r from-red-700 to-amber-700 hover:from-red-600 hover:to-amber-600 text-white font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                      >
                        {isGen ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        <span>{isGen ? "व्हिडिओ जनरेट होत आहे..." : "व्हिडिओ पॅकेज तयार करा"}</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 3. GRAPHICS TAB */}
        {activeTab === "graphics" && (
          <div className="space-y-3">
            <div>
              <span className="font-bold text-gray-200">१५ ब्रॉडकास्ट न्यूज ग्राफिक्स</span>
              <p className="text-[11px] text-gray-400">
                टीव्ही वृत्त चॅनेल स्टाईल ग्राफिक्स थेट टाइमलाइन V3/V4 वर जोडा.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {Object.values(GRAPHIC_TYPE_DEFINITIONS).map((def) => {
                const isV4 = def.type === "logo-watermark";

                return (
                  <div
                    key={def.type}
                    className="p-2.5 bg-gray-800 rounded border border-gray-700 flex items-center justify-between hover:border-gray-500 transition"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 font-bold text-[9px] border border-purple-800">
                          {def.badge}
                        </span>
                        <p className="font-semibold text-gray-200 text-xs">{def.labelMarathi}</p>
                      </div>
                      <p className="text-[10px] text-gray-400 truncate max-w-[200px] mt-0.5">{def.defaultTitle}</p>
                    </div>

                    <button
                      onClick={() =>
                        onAddGraphic({
                          trackId: isV4 ? "V4" : "V3",
                          type: def.type,
                          title: def.defaultTitle,
                          subtitle: def.defaultSubtitle,
                          startTime: currentTime,
                          duration: def.defaultDuration,
                          fontKey: "tiro-press",
                          fontSize: def.type === "headline-card" ? 36 : def.type === "running-ticker" ? 18 : 22,
                          fontWeight: "black",
                          textColor: "#FFFFFF",
                          bgColor:
                            def.type === "breaking-bar"
                              ? "rgba(185, 28, 28, 0.95)"
                              : def.type === "live-badge"
                              ? "rgba(220, 38, 38, 0.95)"
                              : "rgba(17, 24, 39, 0.9)",
                          accentColor: "#FBBF24",
                          positionX: 50,
                          positionY: def.type === "running-ticker" ? 95 : def.type === "lower-third" ? 82 : 50,
                          animation: def.type === "running-ticker" ? "ticker-scroll" : "slide-up",
                          opacity: 1,
                          scale: 1,
                        })
                      }
                      className="px-2.5 py-1 rounded bg-purple-900 hover:bg-purple-800 text-white font-bold text-[10px] flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isV4 ? "V4" : "V3"} जोडा</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. VOICE & TTS TAB */}
        {activeTab === "voice" && (
          <div className="space-y-4">
            {/* ElevenLabs TTS Section */}
            <div className="p-3 bg-gray-800/80 rounded border border-gray-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  ElevenLabs AI व्हॉइसओव्हर
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                  सुरक्षित सर्व्हर API
                </span>
              </div>

              <div>
                <label className="text-[11px] text-gray-400 block mb-1">निवेदक आवाज निवडा:</label>
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-red-500"
                >
                  {DEFAULT_ELEVENLABS_VOICES.map((v) => (
                    <option key={v.voiceId} value={v.voiceId}>
                      {v.name} ({v.languageNote})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-gray-400 block mb-1">मराठी व्हॉइस स्क्रिप्ट:</label>
                <textarea
                  rows={3}
                  value={ttsText}
                  onChange={(e) => setTtsText(e.target.value)}
                  placeholder="वृत्त निवेदकासाठी मराठी मजकूर येथे लिहा..."
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-red-500"
                />
              </div>

              {ttsError && (
                <div className="p-2 rounded bg-red-950 border border-red-800 text-red-300 text-[11px] flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{ttsError}</span>
                </div>
              )}

              <button
                disabled={isGeneratingTts}
                onClick={handleGenerateVoice}
                className="w-full py-1.5 px-3 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                {isGeneratingTts ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{isGeneratingTts ? "व्हॉइस तयार होत आहे..." : "व्हॉइस ऑडिओ जनरेट करा"}</span>
              </button>

              {generatedAudioUrl && (
                <div className="p-2 bg-gray-900 rounded border border-gray-700 space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-400">व्हॉइस ऑडिओ तयार!</span>
                    <span className="text-[10px] text-gray-400">{ttsDuration} सेकंद</span>
                  </div>
                  <audio src={generatedAudioUrl} controls className="w-full h-8" />
                  <button
                    onClick={() =>
                      onAddAudio({
                        trackId: "A2",
                        assetUrl: generatedAudioUrl,
                        title: "AI निवेदक व्हॉईस",
                        startTime: currentTime,
                        duration: ttsDuration,
                        sourceIn: 0,
                        sourceOut: ttsDuration,
                        volume: 100,
                        mute: false,
                        fadeInSeconds: 0.2,
                        fadeOutSeconds: 0.2,
                        sourceType: "elevenlabs",
                      })
                    }
                    className="w-full py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded font-bold text-center"
                  >
                    + A2 ट्रॅकवर जोडा
                  </button>
                </div>
              )}
            </div>

            {/* Field Reporter Mic Recording */}
            <div className="p-3 bg-gray-800/80 rounded border border-gray-700 space-y-2.5">
              <span className="font-bold text-gray-200 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-teal-400" />
                थेट वार्ताहर माईक रेकॉर्डिंग
              </span>
              <p className="text-[11px] text-gray-400">
                घटनास्थळावरून थेट आपल्या आवाजात बातमीचे वार्तांकन रेकॉर्ड करा.
              </p>

              <div className="flex items-center justify-between p-2 bg-gray-900 rounded border border-gray-700">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isRecording ? "bg-red-500 animate-ping" : "bg-gray-600"}`} />
                  <span className="font-mono text-xs">
                    {isRecording ? `रेकॉर्डिंग चालू... ${recordedDuration}s` : "माईक तयार आहे"}
                  </span>
                </div>

                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="px-3 py-1 bg-red-700 hover:bg-red-600 text-white font-bold rounded flex items-center gap-1"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>रेकॉर्ड</span>
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded flex items-center gap-1"
                  >
                    <StopCircle className="w-3.5 h-3.5" />
                    <span>थांबवा</span>
                  </button>
                )}
              </div>

              {recordedAudioUrl && (
                <div className="p-2 bg-gray-900 rounded border border-gray-700 space-y-2 mt-2">
                  <span className="text-[11px] font-bold text-teal-400">रेकॉर्ड केलेला ऑडिओ:</span>
                  <audio src={recordedAudioUrl} controls className="w-full h-8" />
                  <button
                    onClick={() =>
                      onAddAudio({
                        trackId: "A3",
                        assetUrl: recordedAudioUrl,
                        title: "वार्ताहर थेट रेकॉर्डिंग",
                        startTime: currentTime,
                        duration: recordedDuration || 5,
                        sourceIn: 0,
                        sourceOut: recordedDuration || 5,
                        volume: 100,
                        mute: false,
                        fadeInSeconds: 0.2,
                        fadeOutSeconds: 0.2,
                        sourceType: "reporter-recording",
                      })
                    }
                    className="w-full py-1 bg-teal-800 hover:bg-teal-700 text-white rounded font-bold text-center"
                  >
                    + A3 ट्रॅकवर जोडा
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. MUSIC TAB */}
        {activeTab === "music" && (
          <div className="space-y-3">
            <div>
              <span className="font-bold text-gray-200">पार्श्वसंगीत व स्टिंगर्स (Auto-Ducking)</span>
              <p className="text-[11px] text-gray-400">
                जेव्हा वार्ताहर किंवा AI बोलतो तेव्हा संगीत आपोआप २०% पर्यंत मंद होते.
              </p>
            </div>

            <div className="space-y-2">
              {presetMusicTracks.map((trk, i) => (
                <div key={i} className="p-2.5 bg-gray-800 rounded border border-gray-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-200">{trk.title}</span>
                    <span className="text-[10px] text-gray-400">{trk.duration}s</span>
                  </div>

                  <audio src={trk.url} controls className="w-full h-8" />

                  <button
                    onClick={() =>
                      onAddAudio({
                        trackId: "A4",
                        assetUrl: trk.url,
                        title: trk.title,
                        startTime: currentTime,
                        duration: trk.duration,
                        sourceIn: 0,
                        sourceOut: trk.duration,
                        volume: 30,
                        mute: false,
                        fadeInSeconds: 1,
                        fadeOutSeconds: 1,
                        sourceType: "music",
                      })
                    }
                    className="w-full py-1 rounded bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-center"
                  >
                    + A4 पार्श्वसंगीत ट्रॅकवर जोडा
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. TEMPLATES TAB */}
        {activeTab === "templates" && (
          <div className="space-y-3">
            <div>
              <span className="font-bold text-gray-200">१० व्यावसायिक वृत्त टेम्पलेट्स</span>
              <p className="text-[11px] text-gray-400">
                तयार लेआउट, ग्राफिक्स आणि ऑटो-टिकर एका क्लिकमध्ये लोड करा.
              </p>
            </div>

            <div className="space-y-2">
              {Object.values(VIDEO_TEMPLATES).map((tmpl) => (
                <div
                  key={tmpl.templateId}
                  className="p-2.5 bg-gray-800 rounded border border-gray-700 hover:border-gray-500 transition space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-300 font-bold text-[9px] border border-red-800">
                          {tmpl.badge}
                        </span>
                        <p className="font-bold text-gray-200 text-xs">{tmpl.nameMarathi}</p>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">{tmpl.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-gray-700/60 text-[10px] text-gray-400">
                    <span>प्रमाण: {tmpl.canvasRatio} • {tmpl.defaultDurationSeconds} सेकंद</span>
                    <button
                      onClick={() => {
                        if (confirm(`'${tmpl.nameMarathi}' टेम्पलेट लागू करायचे का? चालू टाइमलाइन बदलली जाईल.`)) {
                          onApplyTemplate(tmpl.templateId);
                        }
                      }}
                      className="px-2.5 py-1 bg-red-700 hover:bg-red-600 text-white font-bold rounded transition"
                    >
                      लागू करा
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
