"use client";

import React, { useState } from "react";
import {
  AIProviderDTO,
  createAIProviderAction,
  updateAIProviderAction,
  deleteAIProviderAction,
  setDefaultAIProviderAction,
  toggleAIProviderActiveAction,
  testAIProviderAction,
} from "@/actions/ai-provider.actions";
import {
  Sparkles,
  Plus,
  Check,
  AlertCircle,
  Play,
  Star,
  Trash2,
  Edit2,
  Lock,
  ExternalLink,
  RefreshCw,
  X,
  Server,
  Activity,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  initialProviders: AIProviderDTO[];
  stats: {
    totalRequests: number;
    totalTokens: number;
    successfulRequests: number;
    fallbackRequests: number;
  };
}

export default function AIProviderManager({ initialProviders, stats }: Props) {
  const router = useRouter();
  const [providers, setProviders] = useState<AIProviderDTO[]>(initialProviders);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProviderDTO | null>(null);

  // Testing state
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    id: string;
    success: boolean;
    message: string;
    error?: string;
    latencyMs?: number;
  } | null>(null);

  React.useEffect(() => {
    setProviders(initialProviders);
  }, [initialProviders]);

  // Loading & error state
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    providerType: "GEMINI",
    apiKey: "",
    model: "gemini-2.5-flash",
    baseUrl: "",
    temperature: "0.2",
    maxTokens: "2048",
    timeoutMs: "30000",
    isActive: true,
    isDefault: false,
  });

  const openCreateModal = () => {
    setEditingProvider(null);
    setFormData({
      name: "Google Gemini 2.5 Flash",
      providerType: "GEMINI",
      apiKey: "",
      model: "gemini-2.5-flash",
      baseUrl: "",
      temperature: "0.2",
      maxTokens: "2048",
      timeoutMs: "30000",
      isActive: true,
      isDefault: providers.length === 0,
    });
    setModalError("");
    setIsModalOpen(true);
  };

  const openEditModal = (provider: AIProviderDTO) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      providerType: provider.providerType,
      apiKey: "", // Keep blank unless updating
      model: provider.model,
      baseUrl: provider.baseUrl || "",
      temperature: String(provider.temperature),
      maxTokens: String(provider.maxTokens),
      timeoutMs: String(provider.timeoutMs),
      isActive: provider.isActive,
      isDefault: provider.isDefault,
    });
    setModalError("");
    setIsModalOpen(true);
  };

  const applyPreset = (type: "GEMINI" | "OPENAI" | "GROQ" | "DEEPSEEK") => {
    if (type === "GEMINI") {
      setFormData((prev) => ({
        ...prev,
        name: "Google Gemini 2.5 Flash",
        providerType: "GEMINI",
        model: "gemini-2.5-flash",
        baseUrl: "",
      }));
    } else if (type === "OPENAI") {
      setFormData((prev) => ({
        ...prev,
        name: "OpenAI GPT-4o-mini",
        providerType: "OPENAI",
        model: "gpt-4o-mini",
        baseUrl: "",
      }));
    } else if (type === "GROQ") {
      setFormData((prev) => ({
        ...prev,
        name: "Groq LLaMA 3.3 (High Speed)",
        providerType: "OPENAI_COMPATIBLE",
        model: "llama-3.3-70b-versatile",
        baseUrl: "https://api.groq.com/openai/v1",
      }));
    } else if (type === "DEEPSEEK") {
      setFormData((prev) => ({
        ...prev,
        name: "DeepSeek V3",
        providerType: "OPENAI_COMPATIBLE",
        model: "deepseek-chat",
        baseUrl: "https://api.deepseek.com/v1",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError("");

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("providerType", formData.providerType);
      data.append("apiKey", formData.apiKey);
      data.append("model", formData.model);
      data.append("baseUrl", formData.baseUrl);
      data.append("temperature", formData.temperature);
      data.append("maxTokens", formData.maxTokens);
      data.append("timeoutMs", formData.timeoutMs);
      if (formData.isActive) data.append("isActive", "true");
      if (formData.isDefault) data.append("isDefault", "true");

      const result = editingProvider
        ? await updateAIProviderAction(editingProvider.id, data)
        : await createAIProviderAction(data);

      if (!result.success) {
        setModalError(result.error || "प्रोव्हायडर जतन करणे अयशस्वी झाले.");
        return;
      }

      setIsModalOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setModalError(
        err instanceof Error
          ? err.message
          : "प्रोव्हायडर जतन करताना अनपेक्षित त्रुटी आली."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleTest = async (providerId: string) => {
    setTestingId(providerId);
    setTestResult(null);

    try {
      const res = await testAIProviderAction(providerId);
      setTestResult({
        id: providerId,
        success: res.success,
        message: res.message,
        error: res.error,
        latencyMs: res.latencyMs,
      });

      // Update local state immediately so last test status and error reflect on card
      setProviders((prev) =>
        prev.map((p) =>
          p.id === providerId
            ? {
                ...p,
                lastTestedAt: new Date().toISOString(),
                lastTestStatus: res.success ? "SUCCESS" : "FAILED",
                lastTestError: res.error || null,
              }
            : p
        )
      );

      router.refresh();
    } catch (err: unknown) {
      setTestResult({
        id: providerId,
        success: false,
        message: err instanceof Error ? err.message : "चाचणी अयशस्वी झाली.",
        error: "CLIENT_ERROR",
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleSetDefault = async (providerId: string) => {
    try {
      const res = await setDefaultAIProviderAction(providerId);
      if (!res.success) {
        alert(res.error || "डीफॉल्ट सेट करताना अडचण आली.");
        return;
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "डीफॉल्ट सेट करताना अडचण आली.");
    }
  };

  const handleToggleActive = async (providerId: string) => {
    try {
      const res = await toggleAIProviderActiveAction(providerId);
      if (!res.success) {
        alert(res.error || "स्थिती बदलता आली नाही.");
        return;
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "स्थिती बदलता आली नाही.");
    }
  };

  const handleDelete = async (providerId: string, name: string) => {
    if (!confirm(`तुम्हाला '${name}' हा AI Provider खरोखर हटवायचा आहे का?`)) {
      return;
    }

    try {
      const res = await deleteAIProviderAction(providerId);
      if (!res.success) {
        alert(res.error || "हटवताना त्रुटी आली.");
        return;
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "हटवताना त्रुटी आली.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-purple-100 text-purple-800 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black font-headline text-gray-950">
              AI प्रोव्हायडर व्यवस्थापन (AI Provider Gateway)
            </h1>
          </div>
          <p className="text-xs text-gray-600 mt-1.5 max-w-2xl">
            Google Gemini, OpenAI, Groq, Together AI, किंवा DeepSeek मॉडेल्स जोडा.
            API कीज डेटाबेसमध्ये <strong>AES-256-GCM</strong> एन्क्रिप्शनद्वारे सुरक्षित साठवल्या जातात.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-purple-700 hover:bg-purple-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>नवीन प्रोव्हायडर जोडा (Add Provider)</span>
        </button>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-bold uppercase">एकूण AI कॉल्स</span>
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-xl font-black text-gray-950 font-headline">
            {stats.totalRequests.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-bold uppercase">टोकन्स वापरले</span>
            <Zap className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-xl font-black text-gray-950 font-headline">
            {stats.totalTokens.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-bold uppercase">यशस्वी विनंत्या</span>
            <Check className="w-4 h-4 text-green-600" />
          </div>
          <span className="text-xl font-black text-green-700 font-headline">
            {stats.successfulRequests.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-bold uppercase">स्थानिक फॉलबॅक कॉल्स</span>
            <Server className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-xl font-black text-gray-700 font-headline">
            {stats.fallbackRequests.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Providers Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black font-headline text-gray-950">
            कॉन्फिगर केलेले प्रोव्हायडर्स ({providers.length})
          </h2>
          <span className="text-xs text-gray-500">
            सक्रिय डीफॉल्ट प्रोव्हायडर न्यूजरूम स्टुडिओमध्ये वापरला जातो
          </span>
        </div>

        {providers.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 shadow-xs">
            <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">कोणताही AI प्रोव्हायडर कॉन्फिगर केलेला नाही</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              सध्या अनुप्रयोग पर्यावरण चलांमधील (GEMINI_API_KEY) किंवा स्थानिक सुरक्षित न्यूजरूम इंजिनवर कार्यरत आहे.
              आपण वर दिलेल्या बटणावरून थेट Google Gemini किंवा OpenAI API जोडू शकता.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 bg-purple-700 hover:bg-purple-600 text-white font-bold px-4 py-2 rounded-xl text-xs"
            >
              + पहिला प्रोव्हायडर जोडा
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((p) => {
              const isTesting = testingId === p.id;
              const thisTest = testResult?.id === p.id ? testResult : null;

              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-2xl p-5 border transition-all ${
                    p.isDefault
                      ? "border-purple-500 ring-2 ring-purple-100 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                            p.providerType === "GEMINI"
                              ? "bg-purple-100 text-purple-800"
                              : p.providerType === "OPENAI"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {p.providerType}
                        </span>

                        {p.isDefault && (
                          <span className="flex items-center gap-1 text-[10px] font-black bg-yellow-100 text-yellow-900 px-2 py-0.5 rounded">
                            <Star className="w-3 h-3 fill-yellow-500 text-yellow-600" />
                            सक्रिय डीफॉल्ट (Active Default)
                          </span>
                        )}

                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            p.isActive
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {p.isActive ? "सक्रिय" : "निष्क्रिय"}
                        </span>
                      </div>

                      <h3 className="text-base font-black text-gray-950 truncate">
                        {p.name}
                      </h3>
                      <p className="text-xs text-gray-500 font-mono mt-0.5 truncate">
                        मॉडेल: <strong className="text-gray-900">{p.model}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(p)}
                        title="संपादित करा"
                        className="p-1.5 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        title="हटवा"
                        className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-700 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Details strip */}
                  <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-[11px] text-gray-600">
                    <div className="flex items-center gap-1 font-mono">
                      <Lock className="w-3 h-3 text-gray-400" />
                      <span>{p.maskedKey}</span>
                    </div>

                    <div className="text-right">
                      {p.baseUrl ? (
                        <span className="truncate block font-mono text-[10px] text-gray-500" title={p.baseUrl}>
                          {p.baseUrl.replace(/^https?:\/\//, "")}
                        </span>
                      ) : (
                        <span className="text-gray-400">अधिकृत API गेटवे</span>
                      )}
                    </div>
                  </div>

                  {/* Test Result Message */}
                  {thisTest && (
                    <div
                      className={`mt-3 p-3 rounded-lg text-xs flex items-start gap-2.5 ${
                        thisTest.success
                          ? "bg-green-50 text-green-900 border border-green-200"
                          : "bg-red-50 text-red-900 border border-red-200"
                      }`}
                    >
                      {thisTest.success ? (
                        <Check className="w-4 h-4 text-green-700 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-700 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs leading-relaxed">{thisTest.message}</p>
                        {!thisTest.success && thisTest.error && (
                          <div className="mt-1.5 p-1.5 bg-red-100/80 rounded text-[11px] font-mono text-red-800 break-words border border-red-200/60">
                            {thisTest.error}
                          </div>
                        )}
                        {thisTest.latencyMs !== undefined && (
                          <span className="block mt-1 text-[10px] text-gray-500 font-normal">
                            विलंबता (Latency): {thisTest.latencyMs}ms
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Last tested info */}
                  {p.lastTestedAt && !thisTest && (
                    <div className="mt-2 text-[10px] text-gray-500 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            p.lastTestStatus === "SUCCESS" ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                        <span>
                          शेवटची चाचणी: {new Date(p.lastTestedAt).toLocaleTimeString("mr-IN")}{" "}
                          ({p.lastTestStatus === "SUCCESS" ? "यशस्वी" : "त्रुटी"})
                        </span>
                      </div>
                      {p.lastTestStatus !== "SUCCESS" && p.lastTestError && (
                        <div className="text-[10px] text-red-700 font-mono bg-red-50 rounded p-1.5 border border-red-100 break-words">
                          {p.lastTestError}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleTest(p.id)}
                      disabled={isTesting}
                      className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isTesting ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-700" />
                      ) : (
                        <Play className="w-3.5 h-3.5 text-purple-700" />
                      )}
                      <span>{isTesting ? "चाचणी सुरू..." : "कनेक्शन तपासा"}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(p.id)}
                        className="text-xs text-gray-500 hover:text-gray-900 font-medium"
                      >
                        {p.isActive ? "निष्क्रिय करा" : "सक्रिय करा"}
                      </button>

                      {!p.isDefault && (
                        <button
                          onClick={() => handleSetDefault(p.id)}
                          className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Star className="w-3 h-3" />
                          <span>डीफॉल्ट करा</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-lg font-black font-headline text-gray-950 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-700" />
                <span>
                  {editingProvider ? "AI प्रोव्हायडर संपादित करा" : "नवीन AI प्रोव्हायडर जोडा"}
                </span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3 bg-red-50 text-red-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Quick Presets */}
            {!editingProvider && (
              <div className="mt-4">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
                  त्वरित प्रीसेट्स निवडा (Quick Presets):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset("GEMINI")}
                    className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-800 px-2.5 py-1 rounded-lg font-bold transition-colors"
                  >
                    Gemini 2.5 Flash
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("OPENAI")}
                    className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg font-bold transition-colors"
                  >
                    OpenAI GPT-4o-mini
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("GROQ")}
                    className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-800 px-2.5 py-1 rounded-lg font-bold transition-colors"
                  >
                    Groq LLaMA 3.3
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("DEEPSEEK")}
                    className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-lg font-bold transition-colors"
                  >
                    DeepSeek V3
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-gray-800 mb-1">
                  प्रोव्हायडर नाव (Provider Name):
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="उदा. Google Gemini Flash किंवा OpenAI Prod"
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-800 mb-1">
                    इंजिन प्रकार (Provider Type):
                  </label>
                  <select
                    value={formData.providerType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        providerType: e.target.value as any,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-xs font-semibold"
                  >
                    <option value="GEMINI">Google Gemini</option>
                    <option value="OPENAI">OpenAI</option>
                    <option value="OPENAI_COMPATIBLE">OpenAI-Compatible (Groq/DeepSeek/इ.)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-800 mb-1">
                    मॉडेल आयडी (Model ID):
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="उदा. gemini-2.5-flash, gpt-4o-mini"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">
                  API Key:
                </label>
                <input
                  type="password"
                  required={!editingProvider}
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder={
                    editingProvider
                      ? "की न बदलल्यास रिक्त ठेवा (••••••••)"
                      : "AI Provider ची अधिकृत सिक्रेट API Key प्रविष्ट करा"
                  }
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-xs font-mono"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  की डेटाबेसमध्ये सुरक्षित AES-256-GCM एन्क्रिप्शनमध्ये जतन केली जाईल.
                </p>
              </div>

              {formData.providerType === "OPENAI_COMPATIBLE" && (
                <div>
                  <label className="block font-bold text-gray-800 mb-1">
                    कस्टम बेस URL (Custom Base URL):
                  </label>
                  <input
                    type="url"
                    value={formData.baseUrl}
                    onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                    placeholder="उदा. https://api.groq.com/openai/v1 किंवा http://localhost:11434/v1"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-xs font-mono"
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-800 mb-1">
                    Temperature:
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-800 mb-1">
                    Max Tokens:
                  </label>
                  <input
                    type="number"
                    step="256"
                    value={formData.maxTokens}
                    onChange={(e) => setFormData({ ...formData, maxTokens: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-800 mb-1">
                    Timeout (ms):
                  </label>
                  <input
                    type="number"
                    step="5000"
                    value={formData.timeoutMs}
                    onChange={(e) => setFormData({ ...formData, timeoutMs: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-800">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded text-purple-700"
                  />
                  <span>सक्रिय ठेवा (Is Active)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-800">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="rounded text-purple-700"
                  />
                  <span>सक्रिय डीफॉल्ट बनवा (Set Default)</span>
                </label>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold bg-purple-700 hover:bg-purple-600 text-white rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  {submitting ? "जतन होत आहे..." : "जतन करा (Save Provider)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

