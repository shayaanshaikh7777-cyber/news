import {
  AIArticleStudioOutput,
  AIStudioInput,
  AITestResult,
  AITokenUsage,
} from "../types";

export interface ProviderExecutionResponse {
  output: AIArticleStudioOutput;
  usage: AITokenUsage;
}

export interface IAIProvider {
  generate(input: AIStudioInput): Promise<ProviderExecutionResponse>;
  testConnection(): Promise<AITestResult>;
}

