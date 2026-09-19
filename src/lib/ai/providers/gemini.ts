import { GoogleGenAI } from "@google/genai";
import { IAIProvider, ProviderExecutionResponse } from "./base";
import {
  AIProviderConfig,
  AIStudioInput,
  AITestResult,
} from "../types";
import { SYSTEM_INSTRUCTION, buildEditorialPrompt } from "../prompts";
import { AIArticleStudioOutputSchema } from "../../../schemas/ai.schema";

export type GeminiErrorCode =
  | "INVALID_API_KEY"
  | "PERMISSION_DENIED"
  | "MODEL_NOT_FOUND"
  | "QUOTA_EXCEEDED"
  | "API_DISABLED"
  | "INVALID_REQUEST"
  | "SDK_CONFIGURATION_ERROR"
  | "NETWORK_ERROR";

export interface ClassifiedGeminiError {
  code: GeminiErrorCode;
  userMessage: string;
  safeDetails: string;
}

/**
 * Sanitizes any sensitive tokens or API keys from error text to ensure credentials are never leaked.
 */
export function sanitizeError(text: string): string {
  if (!text) return "";
  return String(text)
    .replace(/AIza[0-9A-Za-z-_]+/g, "AIza••••••••")
    .replace(/(?:key|apiKey|token|secret)=([^\s&"']+)/gi, "key=••••••••")
    .replace(/bearer\s+[a-zA-Z0-9._-]+/gi, "Bearer ••••••••")
    .slice(0, 300);
}

/**
 * Classifies an error thrown by Google Gemini API or SDK into a structured diagnostic object.
 */
export function classifyGeminiError(
  err: unknown,
  modelName: string = "gemini-2.5-flash"
): ClassifiedGeminiError {
  if (!err) {
    return {
      code: "SDK_CONFIGURATION_ERROR",
      userMessage: "अज्ञात त्रुटी आली.",
      safeDetails: "Unknown error occurred.",
    };
  }

  let rawMessage = "";
  if (typeof err === "string") {
    rawMessage = err;
  } else if (err && typeof (err as any).message === "string") {
    rawMessage = (err as any).message;
  } else {
    rawMessage = String(err);
  }

  const status =
    (err as any)?.status || (err as any)?.statusCode || (err as any)?.code;

  let apiErrorObj: any = null;
  if (err && typeof (err as any).error === "object" && (err as any).error !== null) {
    apiErrorObj = (err as any).error;
  }

  if (!apiErrorObj) {
    try {
      const parsed = JSON.parse(rawMessage);
      apiErrorObj = parsed?.error || parsed;
    } catch {
      const match = rawMessage.match(/\{[\s\S]*"error"[\s\S]*\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          apiErrorObj = parsed?.error || parsed;
        } catch {}
      }
    }
  }

  const apiCode = Number(apiErrorObj?.code) || Number(status) || 0;
  const apiStatus = String(apiErrorObj?.status || "").toUpperCase();
  const apiMessage = String(apiErrorObj?.message || rawMessage);

  const reasons: string[] = [];
  if (Array.isArray(apiErrorObj?.details)) {
    for (const d of apiErrorObj.details) {
      if (d?.reason) reasons.push(String(d.reason));
    }
  }
  if (Array.isArray((err as any)?.details)) {
    for (const d of (err as any).details) {
      if (d?.reason) reasons.push(String(d.reason));
    }
  }

  const reasonStr = reasons.join(" ");
  const combined = `${apiStatus} ${apiMessage} ${reasonStr}`.toLowerCase();

  // 1. INVALID_API_KEY
  if (
    reasons.includes("API_KEY_INVALID") ||
    combined.includes("api_key_invalid") ||
    combined.includes("api key not valid") ||
    combined.includes("invalid api key") ||
    (apiCode === 400 && combined.includes("api key"))
  ) {
    return {
      code: "INVALID_API_KEY",
      userMessage: "Gemini API Key अवैध (Invalid) आहे. कृपया Google AI Studio मधून वैध Key तपासा.",
      safeDetails: "Google API Error: API_KEY_INVALID (HTTP 400). The provided Gemini API key is not recognized by Google.",
    };
  }

  // 2. API_DISABLED
  if (
    reasons.includes("SERVICE_DISABLED") ||
    combined.includes("service_disabled") ||
    combined.includes("has not been used in project") ||
    combined.includes("api is disabled") ||
    combined.includes("generativelanguage.googleapis.com is disabled")
  ) {
    return {
      code: "API_DISABLED",
      userMessage: "Google Cloud Project मध्ये Gemini (Generative Language) API सक्षम केलेले नाही.",
      safeDetails: "Google API Error: SERVICE_DISABLED. The Generative Language API is disabled in your Google Cloud project.",
    };
  }

  // 3. PERMISSION_DENIED
  if (
    apiCode === 403 ||
    apiStatus === "PERMISSION_DENIED" ||
    reasons.includes("PERMISSION_DENIED") ||
    combined.includes("unregistered callers") ||
    combined.includes("permission denied") ||
    combined.includes("caller does not have permission")
  ) {
    return {
      code: "PERMISSION_DENIED",
      userMessage: "Gemini API परवानगी नाकारली (Permission Denied). API Key चे अधिकार तपासा.",
      safeDetails: "Google API Error: PERMISSION_DENIED (HTTP 403). The caller does not have permission to access Gemini API.",
    };
  }

  // 4. QUOTA_EXCEEDED
  if (
    apiCode === 429 ||
    apiStatus === "RESOURCE_EXHAUSTED" ||
    reasons.includes("RESOURCE_EXHAUSTED") ||
    reasons.includes("RATE_LIMIT_EXCEEDED") ||
    combined.includes("quota exceeded") ||
    combined.includes("rate limit") ||
    combined.includes("resource_exhausted")
  ) {
    return {
      code: "QUOTA_EXCEEDED",
      userMessage: "Gemini API कोटा किंवा विनंती मर्यादा (Rate Limit / Quota) संपली आहे.",
      safeDetails: "Google API Error: RESOURCE_EXHAUSTED (HTTP 429). Quota or rate limit exceeded.",
    };
  }

  // 5. MODEL_NOT_FOUND
  if (
    apiCode === 404 ||
    apiStatus === "NOT_FOUND" ||
    reasons.includes("MODEL_NOT_FOUND") ||
    (combined.includes("models/") && combined.includes("not found")) ||
    combined.includes("is not found") ||
    combined.includes("is not supported")
  ) {
    return {
      code: "MODEL_NOT_FOUND",
      userMessage: `'${modelName}' हे Gemini मॉडेल उपलब्ध नाही किंवा असमर्थित आहे.`,
      safeDetails: `Google API Error: MODEL_NOT_FOUND (HTTP 404). Model '${modelName}' was not found.`,
    };
  }

  // 6. NETWORK_ERROR
  if (
    combined.includes("fetch failed") ||
    combined.includes("econnrefused") ||
    combined.includes("enotfound") ||
    combined.includes("etimedout") ||
    combined.includes("aborterror") ||
    combined.includes("socket hang up")
  ) {
    return {
      code: "NETWORK_ERROR",
      userMessage: "Google सर्व्हरशी नेटवर्क कनेक्शन जोडता आले नाही. इंटरनेट किंवा DNS तपासा.",
      safeDetails: "Network connection to Google Gemini API failed (connection timeout or DNS resolution failure).",
    };
  }

  // 7. INVALID_REQUEST
  if (apiCode === 400 || apiStatus === "INVALID_ARGUMENT") {
    return {
      code: "INVALID_REQUEST",
      userMessage: "Gemini API विनंती अवैध (Bad Request) आहे.",
      safeDetails: `Google API Error: INVALID_ARGUMENT (HTTP 400). ${sanitizeError(apiMessage)}`,
    };
  }

  // 8. SDK_CONFIGURATION_ERROR fallback
  return {
    code: "SDK_CONFIGURATION_ERROR",
    userMessage: "Gemini SDK कॉन्फिगरेशन त्रुटी आली.",
    safeDetails: sanitizeError(apiMessage || rawMessage),
  };
}

export class GeminiProvider implements IAIProvider {
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  async generate(input: AIStudioInput): Promise<ProviderExecutionResponse> {
    const apiKey = (this.config.apiKey || "").trim();
    if (!apiKey) {
      throw new Error("Gemini API Key उपलब्ध नाही. कृपया वैध API Key प्रविष्ट करा.");
    }

    const ai = new GoogleGenAI({ apiKey });
    const promptText = buildEditorialPrompt(input);
    const modelName = (this.config.model || "gemini-2.5-flash").trim();

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: "user",
          parts: [{ text: `${SYSTEM_INSTRUCTION}\n\n${promptText}` }],
        },
      ],
      config: {
        responseMimeType: "application/json",
        temperature: this.config.temperature ?? 0.2,
        maxOutputTokens: this.config.maxTokens ?? 2048,
      },
    });

    const text = response.text || "";
    // Clean potential markdown code fences like ```json ... ```
    const cleanJson = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    const parsed = JSON.parse(cleanJson);
    const validated = AIArticleStudioOutputSchema.parse(parsed);

    // Extract usage if reported
    const promptTokens = response.usageMetadata?.promptTokenCount || Math.ceil(promptText.length / 4);
    const responseTokens = response.usageMetadata?.candidatesTokenCount || Math.ceil(text.length / 4);
    const totalTokens = response.usageMetadata?.totalTokenCount || (promptTokens + responseTokens);

    return {
      output: validated,
      usage: {
        promptTokens,
        responseTokens,
        totalTokens,
      },
    };
  }

  async testConnection(): Promise<AITestResult> {
    const startTime = Date.now();
    const modelName = (this.config.model || "gemini-2.5-flash").trim();
    const apiKey = (this.config.apiKey || "").trim();

    if (!apiKey) {
      return {
        success: false,
        message: "Gemini API Key उपलब्ध नाही. कृपया वैध API Key प्रविष्ट करा.",
        error: "SDK_CONFIGURATION_ERROR: API key is missing or empty.",
        latencyMs: 0,
        model: modelName,
      };
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: "Respond with the single word: OK" }] }],
      });

      const latencyMs = Date.now() - startTime;
      const text = response.text?.trim() || "";

      return {
        success: true,
        message: `Google Gemini (${modelName}) यशस्वीरित्या कनेक्ट झाले: ${text.slice(0, 30)}`,
        latencyMs,
        model: modelName,
      };
    } catch (err: unknown) {
      const latencyMs = Date.now() - startTime;
      const classified = classifyGeminiError(err, modelName);

      return {
        success: false,
        message: classified.userMessage,
        error: `${classified.code}: ${classified.safeDetails}`,
        latencyMs,
        model: modelName,
      };
    }
  }
}
