import {
  AIArticleStudioOutput,
  AIStudioInput,
  AIActionType,
} from "../../schemas/ai.schema";

export type AIProviderType = "GEMINI" | "OPENAI" | "OPENAI_COMPATIBLE";

export interface AIProviderConfig {
  id: string;
  name: string;
  providerType: AIProviderType;
  apiKey: string; // Plaintext (decrypted only in server memory)
  model: string;
  baseUrl?: string | null;
  isActive: boolean;
  isDefault: boolean;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
}

export interface AIGenerationOptions {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface AITokenUsage {
  promptTokens: number;
  responseTokens: number;
  totalTokens: number;
}

export interface AIExecutionResult {
  output: AIArticleStudioOutput;
  providerName: string;
  providerType: string;
  model: string;
  durationMs: number;
  usage: AITokenUsage;
  isFallback: boolean;
}

export interface AITestResult {
  success: boolean;
  message: string;
  latencyMs: number;
  error?: string;
  model?: string;
}

export {
  type AIArticleStudioOutput,
  type AIStudioInput,
  type AIActionType,
};
