import { aiGateway } from "./ai/gateway";
import {
  AIArticleStudioOutput,
  AIStudioInput,
} from "../schemas/ai.schema";

/**
 * Backward-compatible wrapper delegating to the unified production AI Gateway.
 * Supports Google Gemini, OpenAI, and OpenAI-Compatible providers seamlessly.
 */
export async function processWithGemini(input: AIStudioInput): Promise<AIArticleStudioOutput> {
  const result = await aiGateway.generate(input);
  return result.output;
}

/**
 * 14 Specialized Action Handlers delegated to AI Gateway.
 */
export async function executeAIAction(
  action: string,
  input: AIStudioInput
): Promise<Partial<AIArticleStudioOutput> & { resultText?: string }> {
  return await aiGateway.executeAction(action, input);
}

