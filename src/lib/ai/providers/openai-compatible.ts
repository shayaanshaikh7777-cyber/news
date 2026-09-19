import { IAIProvider, ProviderExecutionResponse } from "./base";
import {
  AIProviderConfig,
  AIStudioInput,
  AITestResult,
} from "../types";
import { SYSTEM_INSTRUCTION, buildEditorialPrompt } from "../prompts";
import { AIArticleStudioOutputSchema } from "../../../schemas/ai.schema";
import { sanitizeError, validateSafeUrl } from "../utils";

export class OpenAICompatibleProvider implements IAIProvider {
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  private getEndpoint(): string {
    const rawBase = (this.config.baseUrl || "https://api.groq.com/openai/v1").trim();
    const urlValidation = validateSafeUrl(rawBase);
    if (!urlValidation.valid) {
      throw new Error(`अवैध AI Provider URL (SSRF Block): ${urlValidation.error}`);
    }
    const base = rawBase.replace(/\/+$/, "");
    if (base.endsWith("/chat/completions")) {
      return base;
    }
    return `${base}/chat/completions`;
  }

  async generate(input: AIStudioInput): Promise<ProviderExecutionResponse> {
    const promptText = buildEditorialPrompt(input);
    const modelName = this.config.model || "llama-3.3-70b-versatile";
    const endpoint = this.getEndpoint();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs || 30000);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (this.config.apiKey) {
        headers["Authorization"] = `Bearer ${this.config.apiKey}`;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: "system", content: SYSTEM_INSTRUCTION },
            { role: "user", content: promptText },
          ],
          response_format: { type: "json_object" },
          temperature: this.config.temperature ?? 0.2,
          max_tokens: this.config.maxTokens ?? 2048,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenAI-Compatible API error [${res.status}]: ${sanitizeError(errText)}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || "";
      const cleanJson = content.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
      const parsed = JSON.parse(cleanJson);
      const validated = AIArticleStudioOutputSchema.parse(parsed);

      const usage = {
        promptTokens: data.usage?.prompt_tokens || Math.ceil(promptText.length / 4),
        responseTokens: data.usage?.completion_tokens || Math.ceil(content.length / 4),
        totalTokens: data.usage?.total_tokens || 0,
      };

      return {
        output: validated,
        usage,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async testConnection(): Promise<AITestResult> {
    const startTime = Date.now();
    const modelName = this.config.model || "llama-3.3-70b-versatile";

    const rawBase = (this.config.baseUrl || "https://api.groq.com/openai/v1").trim();
    const urlValidation = validateSafeUrl(rawBase);
    if (!urlValidation.valid) {
      return {
        success: false,
        message: "OpenAI-Compatible URL सुरक्षा तपासणी अयशस्वी (SSRF Security Guard).",
        error: urlValidation.error || "अवैध किंवा प्रतिबंधित URL पत्ता.",
        latencyMs: 0,
        model: modelName,
      };
    }

    const endpoint = this.getEndpoint();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (this.config.apiKey) {
        headers["Authorization"] = `Bearer ${this.config.apiKey}`;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: "user", content: "Say OK" }],
          max_tokens: 5,
        }),
        signal: controller.signal,
      });

      const latencyMs = Date.now() - startTime;

      if (!res.ok) {
        const errText = await res.text();
        return {
          success: false,
          message: `${this.config.name || "OpenAI-Compatible"} कनेक्शन अयशस्वी झाले.`,
          error: `HTTP ${res.status}: ${sanitizeError(errText.slice(0, 150))}`,
          latencyMs,
          model: modelName,
        };
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content?.trim() || "";

      return {
        success: true,
        message: `${this.config.name} (${modelName}) यशस्वीरित्या कनेक्ट झाले: ${reply}`,
        latencyMs,
        model: modelName,
      };
    } catch (err: unknown) {
      const latencyMs = Date.now() - startTime;
      const errMsg = sanitizeError(err instanceof Error ? err.message : String(err));
      return {
        success: false,
        message: `${this.config.name || "OpenAI-Compatible"} कनेक्शन अयशस्वी झाले.`,
        error: errMsg,
        latencyMs,
        model: modelName,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
