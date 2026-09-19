import { GoogleGenAI } from "@google/genai";
import { IAIProvider, ProviderExecutionResponse } from "./base";
import {
  AIProviderConfig,
  AIStudioInput,
  AITestResult,
} from "../types";
import { SYSTEM_INSTRUCTION, buildEditorialPrompt } from "../prompts";
import { AIArticleStudioOutputSchema } from "../../../schemas/ai.schema";

export class GeminiProvider implements IAIProvider {
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  async generate(input: AIStudioInput): Promise<ProviderExecutionResponse> {
    const ai = new GoogleGenAI({ apiKey: this.config.apiKey });
    const promptText = buildEditorialPrompt(input);

    const modelName = this.config.model || "gemini-2.5-flash";

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
    try {
      const ai = new GoogleGenAI({ apiKey: this.config.apiKey });
      const modelName = this.config.model || "gemini-2.5-flash";

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
      const errMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: "Gemini कनेक्शन अयशस्वी झाले.",
        error: errMsg,
        latencyMs,
        model: this.config.model,
      };
    }
  }
}
