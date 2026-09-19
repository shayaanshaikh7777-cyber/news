import prisma, { isDatabaseAvailable } from "../prisma";
import { decryptApiKey } from "./encryption";
import {
  AIArticleStudioOutput,
  AIExecutionResult,
  AIProviderConfig,
  AIStudioInput,
  AITestResult,
} from "./types";
import { IAIProvider } from "./providers/base";
import { GeminiProvider } from "./providers/gemini";
import { OpenAIProvider } from "./providers/openai";
import { OpenAICompatibleProvider } from "./providers/openai-compatible";
import { generateDeterministicNewsroomOutput } from "./fallback-generator";

export class AIGateway {
  /**
   * Resolves the active provider config:
   * 1. Check database for active default provider
   * 2. Fall back to environment variables (GEMINI_API_KEY, OPENAI_API_KEY)
   * 3. Return null if none configured
   */
  async getActiveProviderConfig(): Promise<AIProviderConfig | null> {
    try {
      if (await isDatabaseAvailable()) {
        const defaultProvider = await prisma.aIProvider.findFirst({
          where: { isDefault: true, isActive: true },
        });

        if (defaultProvider) {
          const plainKey = decryptApiKey(defaultProvider.apiKeyEncrypted);
          return {
            id: defaultProvider.id,
            name: defaultProvider.name,
            providerType: defaultProvider.providerType as any,
            apiKey: plainKey,
            model: defaultProvider.model,
            baseUrl: defaultProvider.baseUrl,
            isActive: defaultProvider.isActive,
            isDefault: defaultProvider.isDefault,
            temperature: defaultProvider.temperature,
            maxTokens: defaultProvider.maxTokens,
            timeoutMs: defaultProvider.timeoutMs,
          };
        }
      }
    } catch (err) {
      console.warn("[AIGateway] Failed to query default AI provider from DB:", err);
    }

    // Fallback to environment variables
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 5) {
      return {
        id: "env-gemini",
        name: "Google Gemini (Env)",
        providerType: "GEMINI",
        apiKey: process.env.GEMINI_API_KEY.trim(),
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        baseUrl: null,
        isActive: true,
        isDefault: true,
        temperature: 0.2,
        maxTokens: 2048,
        timeoutMs: 30000,
      };
    }

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 5) {
      return {
        id: "env-openai",
        name: "OpenAI (Env)",
        providerType: "OPENAI",
        apiKey: process.env.OPENAI_API_KEY.trim(),
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        baseUrl: null,
        isActive: true,
        isDefault: true,
        temperature: 0.2,
        maxTokens: 2048,
        timeoutMs: 30000,
      };
    }

    return null;
  }

  /**
   * Instantiates an adapter for the given provider configuration.
   */
  createProviderInstance(config: AIProviderConfig): IAIProvider {
    switch (config.providerType) {
      case "GEMINI":
        return new GeminiProvider(config);
      case "OPENAI":
        return new OpenAIProvider(config);
      case "OPENAI_COMPATIBLE":
        return new OpenAICompatibleProvider(config);
      default:
        return new GeminiProvider(config);
    }
  }

  /**
   * Generates structured newsroom output using the active provider with seamless fallback.
   */
  async generate(
    input: AIStudioInput,
    options?: { userId?: string }
  ): Promise<AIExecutionResult> {
    const startTime = Date.now();
    const config = await this.getActiveProviderConfig();

    if (config) {
      try {
        const provider = this.createProviderInstance(config);
        const { output, usage } = await provider.generate(input);
        const durationMs = Date.now() - startTime;

        // Record usage asynchronously
        this.logUsage({
          providerId: config.id.startsWith("env-") ? null : config.id,
          providerType: config.providerType,
          model: config.model,
          action: input.action,
          promptTokens: usage.promptTokens,
          responseTokens: usage.responseTokens,
          totalTokens: usage.totalTokens,
          durationMs,
          status: "SUCCESS",
          userId: options?.userId,
        });

        return {
          output,
          providerName: config.name,
          providerType: config.providerType,
          model: config.model,
          durationMs,
          usage,
          isFallback: false,
        };
      } catch (err: unknown) {
        const durationMs = Date.now() - startTime;
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn(`[AIGateway] Provider ${config.name} call failed, falling back to newsroom generator:`, errMsg);

        this.logUsage({
          providerId: config.id.startsWith("env-") ? null : config.id,
          providerType: config.providerType,
          model: config.model,
          action: input.action,
          promptTokens: 0,
          responseTokens: 0,
          totalTokens: 0,
          durationMs,
          status: "FALLBACK",
          errorMessage: errMsg,
          userId: options?.userId,
        });
      }
    }

    // Resilient Fallback
    const fallbackOutput = generateDeterministicNewsroomOutput(input);
    const durationMs = Date.now() - startTime;

    return {
      output: fallbackOutput,
      providerName: "स्थानिक न्यूजरूम इंजिन (Local Engine)",
      providerType: "DETERMINISTIC",
      model: "marathi-newsroom-v1",
      durationMs,
      usage: {
        promptTokens: 0,
        responseTokens: 0,
        totalTokens: 0,
      },
      isFallback: true,
    };
  }

  /**
   * Executes a specific editorial action (e.g. REWRITE_HEADLINE, GENERATE_SEO, etc.)
   */
  async executeAction(
    action: string,
    input: AIStudioInput,
    options?: { userId?: string }
  ): Promise<Partial<AIArticleStudioOutput> & {
    resultText?: string;
    providerName: string;
    model: string;
    isFallback: boolean;
  }> {
    const execution = await this.generate({ ...input, action: action as any }, options);
    const full = execution.output;
    const meta = {
      providerName: execution.providerName,
      model: execution.model,
      isFallback: execution.isFallback,
    };

    switch (action) {
      case "REWRITE_HEADLINE":
        return { headline: full.headline, resultText: full.headline, ...meta };
      case "GENERATE_SEO":
        return { seo: full.seo, ...meta };
      case "IMPROVE_MARATHI":
        return { body_markdown: full.body_markdown, headline: full.headline, ...meta };
      case "SHORTEN_ARTICLE":
        return { summary: full.summary, body_markdown: full.summary, ...meta };
      case "EXPAND_ARTICLE":
        return { body_markdown: full.body_markdown, ...meta };
      case "GENERATE_SUMMARY":
        return { summary: full.summary, resultText: full.summary, ...meta };
      case "GENERATE_KEY_TAKEAWAYS":
        return { key_takeaways: full.key_takeaways, ...meta };
      case "GENERATE_FACEBOOK_CAPTION":
        return { social: full.social, resultText: full.social.facebook_caption, ...meta };
      case "GENERATE_INSTAGRAM_CAPTION":
        return { social: full.social, resultText: full.social.instagram_caption, ...meta };
      case "GENERATE_WHATSAPP_MESSAGE":
        return { social: full.social, resultText: full.social.whatsapp_message, ...meta };
      case "GENERATE_BREAKING_HEADLINE":
        return {
          headline: `🚨 ब्रेकिंग: ${full.headline.replace(/^[^:]+:\s*/, "")}`,
          resultText: `🚨 ब्रेकिंग: ${full.headline.replace(/^[^:]+:\s*/, "")}`,
          ...meta,
        };
      case "GENERATE_PUSH_NOTIFICATION":
        return {
          resultText: `${full.headline.slice(0, 75)}... वाचा आवाज जामखेडचा वर`,
          ...meta,
        };
      case "GENERATE_CLIPPING_TEXT":
        return {
          body_markdown: full.body_markdown,
          resultText: full.body_markdown,
          ...meta,
        };
      case "GENERATE_ARTICLE":
      default:
        return { ...full, ...meta };
    }
  }

  /**
   * Tests a provider configuration for live connectivity.
   */
  async testProvider(config: AIProviderConfig): Promise<AITestResult> {
    const provider = this.createProviderInstance(config);
    return await provider.testConnection();
  }

  private async logUsage(data: {
    providerId?: string | null;
    providerType: string;
    model: string;
    action: string;
    promptTokens: number;
    responseTokens: number;
    totalTokens: number;
    durationMs: number;
    status: string;
    errorMessage?: string;
    userId?: string;
  }) {
    try {
      if (await isDatabaseAvailable()) {
        await prisma.aIUsageLog.create({
          data: {
            providerId: data.providerId || null,
            providerType: data.providerType,
            model: data.model,
            action: data.action,
            promptTokens: data.promptTokens,
            responseTokens: data.responseTokens,
            totalTokens: data.totalTokens,
            durationMs: data.durationMs,
            status: data.status,
            errorMessage: data.errorMessage || null,
            userId: data.userId || null,
          },
        }).catch(() => {});
      }
    } catch {
      // Non-blocking telemetry
    }
  }
}

export const aiGateway = new AIGateway();
export default aiGateway;

