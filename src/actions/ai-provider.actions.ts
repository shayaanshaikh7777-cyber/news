"use server";

import prisma, { isDatabaseAvailable } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isSuperAdmin, SessionUser } from "@/lib/rbac";
import { recordAuditLog } from "@/lib/audit";
import { encryptApiKey, decryptApiKey, maskApiKey } from "@/lib/ai/encryption";
import { aiGateway } from "@/lib/ai/gateway";
import { AIProviderType, AITestResult } from "@/lib/ai/types";
import { revalidatePath } from "next/cache";

export interface AIProviderDTO {
  id: string;
  name: string;
  providerType: AIProviderType;
  model: string;
  baseUrl: string | null;
  maskedKey: string;
  isActive: boolean;
  isDefault: boolean;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
  lastTestedAt: string | null;
  lastTestStatus: string | null;
  lastTestError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AIProviderActionResult {
  success: boolean;
  error?: string;
  id?: string;
  isActive?: boolean;
}

/**
 * Schema management is handled through Prisma migrations and syncDatabaseSchemaAction.
 * Kept as safe no-op for backwards compatibility.
 */
export async function ensureAITablesExist(): Promise<void> {
  return;
}

async function verifySuperAdmin(): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  if (!user || !isSuperAdmin(user.role)) {
    return null;
  }
  return user;
}

/**
 * Lists all configured AI providers with masked API keys.
 */
export async function getAIProvidersAction(): Promise<AIProviderDTO[]> {
  try {
    const user = await verifySuperAdmin();
    if (!user) return [];

    if (!(await isDatabaseAvailable())) {
      return [];
    }

    await ensureAITablesExist();

    const providers = await prisma.aIProvider.findMany({
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return providers.map((p) => {
      let masked = "••••••••";
      try {
        const plain = decryptApiKey(p.apiKeyEncrypted);
        masked = maskApiKey(plain);
      } catch {
        masked = "••••••••";
      }

      return {
        id: p.id,
        name: p.name,
        providerType: p.providerType as AIProviderType,
        model: p.model,
        baseUrl: p.baseUrl,
        maskedKey: masked,
        isActive: p.isActive,
        isDefault: p.isDefault,
        temperature: p.temperature,
        maxTokens: p.maxTokens,
        timeoutMs: p.timeoutMs,
        lastTestedAt: p.lastTestedAt ? p.lastTestedAt.toISOString() : null,
        lastTestStatus: p.lastTestStatus,
        lastTestError: p.lastTestError,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      };
    });
  } catch (error) {
    console.error("[getAIProvidersAction error]", error);
    return [];
  }
}

/**
 * Creates a new AI provider record.
 * Returns safe result object; never throws unhandled errors to client.
 */
export async function createAIProviderAction(
  formData: FormData
): Promise<{ success: boolean; error?: string; id?: string }> {
  try {
    const user = await verifySuperAdmin();
    if (!user) {
      return {
        success: false,
        error: "अनधिकृत वापर. फक्त मुख्य प्रशासकाला (Super Admin) परवानगी आहे.",
      };
    }

    if (!(await isDatabaseAvailable())) {
      return {
        success: false,
        error: "डेटाबेस उपलब्ध नाही. कृपया DATABASE_URL तपासा.",
      };
    }

    const name = String(formData.get("name") || "").trim();
    const providerType = String(formData.get("providerType") || "GEMINI") as AIProviderType;
    const apiKey = String(formData.get("apiKey") || "").trim();
    const model = String(formData.get("model") || "").trim();
    const baseUrl = String(formData.get("baseUrl") || "").trim() || null;
    const temperature = parseFloat(String(formData.get("temperature") || "0.2"));
    const maxTokens = parseInt(String(formData.get("maxTokens") || "2048"), 10);
    const timeoutMs = parseInt(String(formData.get("timeoutMs") || "30000"), 10);
    const isActive = formData.get("isActive") === "on" || formData.get("isActive") === "true";
    const isDefault = formData.get("isDefault") === "on" || formData.get("isDefault") === "true";

    if (!name || !model) {
      return {
        success: false,
        error: "नाव (Provider Name) आणि मॉडेल (Model ID) अनिवार्य आहेत.",
      };
    }
    if (!apiKey) {
      return {
        success: false,
        error: "API Key अनिवार्य आहे. कृपया वैध API Key प्रविष्ट करा.",
      };
    }

    let apiKeyEncrypted: string;
    try {
      apiKeyEncrypted = encryptApiKey(apiKey);
    } catch (encErr) {
      console.error("[AIProvider Encryption Error]:", encErr);
      return {
        success: false,
        error: "API Key एन्क्रिप्शन अयशस्वी झाले. कृपया AI_ENCRYPTION_KEY कॉन्फिगरेशन तपासा.",
      };
    }

    await ensureAITablesExist();

    // If this provider is default, unset any existing default
    if (isDefault) {
      try {
        await prisma.aIProvider.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      } catch (err) {
        console.warn("[AIProvider updateMany default warning]:", err);
      }
    }

    const created = await prisma.aIProvider.create({
      data: {
        name,
        providerType,
        apiKeyEncrypted,
        model,
        baseUrl,
        temperature: isNaN(temperature) ? 0.2 : temperature,
        maxTokens: isNaN(maxTokens) ? 2048 : maxTokens,
        timeoutMs: isNaN(timeoutMs) ? 30000 : timeoutMs,
        isActive,
        isDefault,
      },
    });

    try {
      await recordAuditLog({
        userId: user.id,
        action: "CREATE_AI_PROVIDER",
        entity: "AIProvider",
        entityId: created.id,
        details: { name, providerType, model, isDefault },
      });
    } catch (auditErr) {
      console.warn("[AuditLog warning]:", auditErr);
    }

    try {
      revalidatePath("/admin/settings/ai");
      revalidatePath("/admin/ai-studio");
    } catch (revErr) {
      console.warn("[revalidatePath warning]:", revErr);
    }

    return { success: true, id: created.id };
  } catch (error: any) {
    console.error("[createAIProviderAction Error]:", error?.message || error);
    if (error?.code === "P2021" || String(error?.message).includes("does not exist")) {
      return {
        success: false,
        error: "डेटाबेस त्रुटी: AIProvider टेबल सापडले नाही. कृपया Supabase मायग्रेशन तपासा.",
      };
    }
    const rawMsg = String(error?.message || "प्रोव्हायडर जतन करताना सर्व्हर त्रुटी आली.");
    const safeMsg = rawMsg.replace(/:[^:@]+@/, ":••••••••@").slice(0, 200);
    return {
      success: false,
      error: `प्रोव्हायडर जतन करणे अयशस्वी: ${safeMsg}`,
    };
  }
}

/**
 * Updates an existing AI provider.
 */
export async function updateAIProviderAction(
  providerId: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await verifySuperAdmin();
    if (!user) {
      return {
        success: false,
        error: "अनधिकृत वापर. फक्त मुख्य प्रशासकाला (Super Admin) परवानगी आहे.",
      };
    }

    if (!(await isDatabaseAvailable())) {
      return {
        success: false,
        error: "डेटाबेस उपलब्ध नाही. कृपया DATABASE_URL तपासा.",
      };
    }

    await ensureAITablesExist();

    const existing = await prisma.aIProvider.findUnique({
      where: { id: providerId },
    });

    if (!existing) {
      return {
        success: false,
        error: "AI Provider सापडला नाही.",
      };
    }

    const name = String(formData.get("name") || "").trim();
    const providerType = String(formData.get("providerType") || existing.providerType) as AIProviderType;
    const newApiKey = String(formData.get("apiKey") || "").trim();
    const model = String(formData.get("model") || existing.model).trim();
    const baseUrl = String(formData.get("baseUrl") || "").trim() || null;
    const temperature = parseFloat(String(formData.get("temperature") || existing.temperature));
    const maxTokens = parseInt(String(formData.get("maxTokens") || existing.maxTokens), 10);
    const timeoutMs = parseInt(String(formData.get("timeoutMs") || existing.timeoutMs), 10);
    const isActive = formData.get("isActive") === "on" || formData.get("isActive") === "true";
    const isDefault = formData.get("isDefault") === "on" || formData.get("isDefault") === "true";

    let apiKeyEncrypted = existing.apiKeyEncrypted;
    if (newApiKey && newApiKey.length > 0) {
      try {
        apiKeyEncrypted = encryptApiKey(newApiKey);
      } catch (encErr) {
        return {
          success: false,
          error: "API Key एन्क्रिप्शन अयशस्वी झाले.",
        };
      }
    }

    if (isDefault && !existing.isDefault) {
      try {
        await prisma.aIProvider.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      } catch (err) {
        console.warn("[AIProvider updateMany default warning]:", err);
      }
    }

    await prisma.aIProvider.update({
      where: { id: providerId },
      data: {
        name: name || existing.name,
        providerType,
        apiKeyEncrypted,
        model,
        baseUrl,
        temperature: isNaN(temperature) ? 0.2 : temperature,
        maxTokens: isNaN(maxTokens) ? 2048 : maxTokens,
        timeoutMs: isNaN(timeoutMs) ? 30000 : timeoutMs,
        isActive,
        isDefault,
        ...(model !== existing.model ? { lastTestError: null, lastTestStatus: null } : {}),
      },
    });

    try {
      await recordAuditLog({
        userId: user.id,
        action: "UPDATE_AI_PROVIDER",
        entity: "AIProvider",
        entityId: providerId,
        details: { name, providerType, model, isDefault },
      });
    } catch (auditErr) {
      console.warn("[AuditLog warning]:", auditErr);
    }

    try {
      revalidatePath("/admin/settings/ai");
      revalidatePath("/admin/ai-studio");
    } catch (revErr) {
      console.warn("[revalidatePath warning]:", revErr);
    }

    return { success: true };
  } catch (error: any) {
    console.error("[updateAIProviderAction Error]:", error?.message || error);
    const rawMsg = String(error?.message || "प्रोव्हायडर अद्ययावत करताना सर्व्हर त्रुटी आली.");
    const safeMsg = rawMsg.replace(/:[^:@]+@/, ":••••••••@").slice(0, 200);
    return {
      success: false,
      error: `प्रोव्हायडर अद्ययावत करणे अयशस्वी: ${safeMsg}`,
    };
  }
}

/**
 * Deletes an AI provider.
 */
export async function deleteAIProviderAction(
  providerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await verifySuperAdmin();
    if (!user) {
      return {
        success: false,
        error: "अनधिकृत वापर. फक्त मुख्य प्रशासकाला परवानगी आहे.",
      };
    }

    if (!(await isDatabaseAvailable())) {
      return {
        success: false,
        error: "डेटाबेस उपलब्ध नाही.",
      };
    }

    const existing = await prisma.aIProvider.findUnique({
      where: { id: providerId },
    });

    if (!existing) {
      return {
        success: false,
        error: "AI Provider सापडला नाही.",
      };
    }

    await prisma.aIProvider.delete({
      where: { id: providerId },
    });

    try {
      await recordAuditLog({
        userId: user.id,
        action: "DELETE_AI_PROVIDER",
        entity: "AIProvider",
        entityId: providerId,
        details: { name: existing.name, model: existing.model },
      });
    } catch (auditErr) {
      console.warn("[AuditLog warning]:", auditErr);
    }

    try {
      revalidatePath("/admin/settings/ai");
      revalidatePath("/admin/ai-studio");
    } catch (revErr) {
      console.warn("[revalidatePath warning]:", revErr);
    }

    return { success: true };
  } catch (error: any) {
    console.error("[deleteAIProviderAction Error]:", error?.message || error);
    const rawMsg = String(error?.message || "हटवताना त्रुटी आली.");
    const safeMsg = rawMsg.replace(/:[^:@]+@/, ":••••••••@").slice(0, 200);
    return {
      success: false,
      error: `हटवणे अयशस्वी: ${safeMsg}`,
    };
  }
}

/**
 * Sets a specific provider as the default.
 */
export async function setDefaultAIProviderAction(
  providerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await verifySuperAdmin();
    if (!user) {
      return {
        success: false,
        error: "अनधिकृत वापर. फक्त मुख्य प्रशासकाला परवानगी आहे.",
      };
    }

    if (!(await isDatabaseAvailable())) {
      return {
        success: false,
        error: "डेटाबेस उपलब्ध नाही.",
      };
    }

    await prisma.aIProvider.updateMany({
      data: { isDefault: false },
    });

    await prisma.aIProvider.update({
      where: { id: providerId },
      data: { isDefault: true, isActive: true },
    });

    try {
      await recordAuditLog({
        userId: user.id,
        action: "SET_DEFAULT_AI_PROVIDER",
        entity: "AIProvider",
        entityId: providerId,
      });
    } catch (auditErr) {
      console.warn("[AuditLog warning]:", auditErr);
    }

    try {
      revalidatePath("/admin/settings/ai");
      revalidatePath("/admin/ai-studio");
    } catch (revErr) {
      console.warn("[revalidatePath warning]:", revErr);
    }

    return { success: true };
  } catch (error: any) {
    console.error("[setDefaultAIProviderAction Error]:", error?.message || error);
    const rawMsg = String(error?.message || "डीफॉल्ट सेट करताना त्रुटी आली.");
    const safeMsg = rawMsg.replace(/:[^:@]+@/, ":••••••••@").slice(0, 200);
    return {
      success: false,
      error: `डीफॉल्ट सेट करणे अयशस्वी: ${safeMsg}`,
    };
  }
}

/**
 * Toggles provider active state.
 */
export async function toggleAIProviderActiveAction(
  providerId: string
): Promise<{ success: boolean; error?: string; isActive?: boolean }> {
  try {
    const user = await verifySuperAdmin();
    if (!user) {
      return {
        success: false,
        error: "अनधिकृत वापर. फक्त मुख्य प्रशासकाला परवानगी आहे.",
      };
    }

    if (!(await isDatabaseAvailable())) {
      return {
        success: false,
        error: "डेटाबेस उपलब्ध नाही.",
      };
    }

    const provider = await prisma.aIProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      return {
        success: false,
        error: "AI Provider सापडला नाही.",
      };
    }

    const updated = await prisma.aIProvider.update({
      where: { id: providerId },
      data: { isActive: !provider.isActive },
    });

    try {
      revalidatePath("/admin/settings/ai");
      revalidatePath("/admin/ai-studio");
    } catch (revErr) {
      console.warn("[revalidatePath warning]:", revErr);
    }

    return { success: true, isActive: updated.isActive };
  } catch (error: any) {
    console.error("[toggleAIProviderActiveAction Error]:", error?.message || error);
    const rawMsg = String(error?.message || "स्थिती बदलताना त्रुटी आली.");
    const safeMsg = rawMsg.replace(/:[^:@]+@/, ":••••••••@").slice(0, 200);
    return {
      success: false,
      error: `स्थिती बदलणे अयशस्वी: ${safeMsg}`,
    };
  }
}

/**
 * Safely updates a provider's model ID without exposing or modifying the stored API key.
 */
export async function updateProviderModelAction(
  providerId: string,
  newModel: string,
  newName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await verifySuperAdmin();
    if (!user) {
      return { success: false, error: "अनधिकृत वापर. फक्त मुख्य प्रशासकाला परवानगी आहे." };
    }

    if (!(await isDatabaseAvailable())) {
      return { success: false, error: "डेटाबेस उपलब्ध नाही." };
    }

    const provider = await prisma.aIProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      return { success: false, error: "AI Provider सापडला नाही." };
    }

    const cleanModel = newModel.trim();
    if (!cleanModel) {
      return { success: false, error: "मॉडेल आयडी रिक्त असू शकत नाही." };
    }

    const updatedName = newName?.trim() || (
      provider.name.includes("2.5")
        ? provider.name.replace("2.5", "3.6")
        : provider.name
    );

    await prisma.aIProvider.update({
      where: { id: providerId },
      data: {
        model: cleanModel,
        name: updatedName,
        lastTestError: null,
        lastTestStatus: null,
      },
    });

    try {
      await recordAuditLog({
        userId: user.id,
        action: "UPDATE_AI_PROVIDER_MODEL",
        entity: "AIProvider",
        entityId: providerId,
        details: { oldModel: provider.model, newModel: cleanModel },
      });
    } catch {}

    try {
      revalidatePath("/admin/settings/ai");
      revalidatePath("/admin/ai-studio");
    } catch {}

    return { success: true };
  } catch (err: any) {
    console.error("[updateProviderModelAction Error]:", err);
    return { success: false, error: "मॉडेल अद्ययावत करताना त्रुटी आली." };
  }
}

/**
 * Tests a provider's live connection.
 */
export async function testAIProviderAction(providerId: string): Promise<AITestResult> {
  try {
    const user = await verifySuperAdmin();
    if (!user) {
      return {
        success: false,
        message: "अनधिकृत वापर. फक्त मुख्य प्रशासकाला परवानगी आहे.",
        latencyMs: 0,
        error: "UNAUTHORIZED",
      };
    }

    if (!(await isDatabaseAvailable())) {
      return {
        success: false,
        message: "डेटाबेस उपलब्ध नाही. चाचणी करता येत नाही.",
        latencyMs: 0,
        error: "DB_UNAVAILABLE",
      };
    }

    const provider = await prisma.aIProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      return {
        success: false,
        message: "AI Provider सापडला नाही.",
        latencyMs: 0,
        error: "NOT_FOUND",
      };
    }

    let plainKey = "";
    try {
      plainKey = decryptApiKey(provider.apiKeyEncrypted);
    } catch {
      return {
        success: false,
        message: "API Key डिक्रिप्शन अयशस्वी. कृपया की पुन्हा सेव्ह करा.",
        latencyMs: 0,
        error: "DECRYPTION_FAILED",
      };
    }

    const testResult = await aiGateway.testProvider({
      id: provider.id,
      name: provider.name,
      providerType: provider.providerType as AIProviderType,
      apiKey: plainKey,
      model: provider.model,
      baseUrl: provider.baseUrl,
      isActive: provider.isActive,
      isDefault: provider.isDefault,
      temperature: provider.temperature,
      maxTokens: provider.maxTokens,
      timeoutMs: provider.timeoutMs,
    });

    try {
      await prisma.aIProvider.update({
        where: { id: providerId },
        data: {
          lastTestedAt: new Date(),
          lastTestStatus: testResult.success ? "SUCCESS" : "FAILED",
          lastTestError: testResult.error || null,
        },
      });
    } catch (err) {
      console.warn("[testAIProviderAction status update warning]:", err);
    }

    try {
      revalidatePath("/admin/settings/ai");
    } catch {}

    return testResult;
  } catch (err: any) {
    console.error("[testAIProviderAction error]:", err);
    return {
      success: false,
      message: `चाचणी अयशस्वी: ${String(err?.message || "सर्व्हर त्रुटी").slice(0, 150)}`,
      latencyMs: 0,
      error: "UNEXPECTED_ERROR",
    };
  }
}

/**
 * Aggregates AI token usage statistics.
 */
export async function getAIUsageStatsAction() {
  try {
    const user = await verifySuperAdmin();
    if (!user) {
      return {
        totalRequests: 0,
        totalTokens: 0,
        successfulRequests: 0,
        fallbackRequests: 0,
      };
    }

    if (!(await isDatabaseAvailable())) {
      return {
        totalRequests: 0,
        totalTokens: 0,
        successfulRequests: 0,
        fallbackRequests: 0,
      };
    }

    await ensureAITablesExist();

    const [total, success, fallback, tokenAggregation] = await Promise.all([
      prisma.aIUsageLog.count(),
      prisma.aIUsageLog.count({ where: { status: "SUCCESS" } }),
      prisma.aIUsageLog.count({ where: { status: "FALLBACK" } }),
      prisma.aIUsageLog.aggregate({
        _sum: { totalTokens: true },
      }),
    ]);

    return {
      totalRequests: total,
      totalTokens: tokenAggregation._sum.totalTokens || 0,
      successfulRequests: success,
      fallbackRequests: fallback,
    };
  } catch (error) {
    console.error("[getAIUsageStatsAction error]", error);
    return {
      totalRequests: 0,
      totalTokens: 0,
      successfulRequests: 0,
      fallbackRequests: 0,
    };
  }
}
