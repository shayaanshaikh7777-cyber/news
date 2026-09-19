"use server";

import prisma, { isDatabaseAvailable } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/rbac";
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

async function verifySuperAdmin() {
  const user = await getCurrentUser();
  if (!user || !isSuperAdmin(user.role)) {
    throw new Error("अनधिकृत वापर. फक्त मुख्य प्रशासकाला परवानगी आहे (Super Admin only).");
  }
  return user;
}

/**
 * Lists all configured AI providers with masked API keys.
 */
export async function getAIProvidersAction(): Promise<AIProviderDTO[]> {
  try {
    await verifySuperAdmin();

    if (!(await isDatabaseAvailable())) {
      return [];
    }

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
 */
export async function createAIProviderAction(formData: FormData) {
  const user = await verifySuperAdmin();

  if (!(await isDatabaseAvailable())) {
    throw new Error("डेटाबेस उपलब्ध नाही. कृपया DATABASE_URL तपासा.");
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
    throw new Error("नाव आणि मॉडेल अनिवार्य आहेत.");
  }
  if (!apiKey) {
    throw new Error("API Key अनिवार्य आहे.");
  }

  const apiKeyEncrypted = encryptApiKey(apiKey);

  // If this provider is default, unset any existing default
  if (isDefault) {
    await prisma.aIProvider.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
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

  await recordAuditLog({
    userId: user.id,
    action: "CREATE_AI_PROVIDER",
    entity: "AIProvider",
    entityId: created.id,
    details: { name, providerType, model, isDefault },
  });

  revalidatePath("/admin/settings/ai");
  revalidatePath("/admin/ai-studio");
  return { success: true, id: created.id };
}

/**
 * Updates an existing AI provider.
 */
export async function updateAIProviderAction(providerId: string, formData: FormData) {
  const user = await verifySuperAdmin();

  if (!(await isDatabaseAvailable())) {
    throw new Error("डेटाबेस उपलब्ध नाही.");
  }

  const existing = await prisma.aIProvider.findUnique({
    where: { id: providerId },
  });

  if (!existing) {
    throw new Error("AI Provider सापडला नाही.");
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
    apiKeyEncrypted = encryptApiKey(newApiKey);
  }

  if (isDefault && !existing.isDefault) {
    await prisma.aIProvider.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
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
    },
  });

  await recordAuditLog({
    userId: user.id,
    action: "UPDATE_AI_PROVIDER",
    entity: "AIProvider",
    entityId: providerId,
    details: { name, providerType, model, isDefault },
  });

  revalidatePath("/admin/settings/ai");
  revalidatePath("/admin/ai-studio");
  return { success: true };
}

/**
 * Deletes an AI provider.
 */
export async function deleteAIProviderAction(providerId: string) {
  const user = await verifySuperAdmin();

  if (!(await isDatabaseAvailable())) {
    throw new Error("डेटाबेस उपलब्ध नाही.");
  }

  const existing = await prisma.aIProvider.findUnique({
    where: { id: providerId },
  });

  if (!existing) {
    throw new Error("AI Provider सापडला नाही.");
  }

  await prisma.aIProvider.delete({
    where: { id: providerId },
  });

  await recordAuditLog({
    userId: user.id,
    action: "DELETE_AI_PROVIDER",
    entity: "AIProvider",
    entityId: providerId,
    details: { name: existing.name, model: existing.model },
  });

  revalidatePath("/admin/settings/ai");
  revalidatePath("/admin/ai-studio");
  return { success: true };
}

/**
 * Sets a specific provider as the default.
 */
export async function setDefaultAIProviderAction(providerId: string) {
  const user = await verifySuperAdmin();

  if (!(await isDatabaseAvailable())) {
    throw new Error("डेटाबेस उपलब्ध नाही.");
  }

  await prisma.aIProvider.updateMany({
    data: { isDefault: false },
  });

  await prisma.aIProvider.update({
    where: { id: providerId },
    data: { isDefault: true, isActive: true },
  });

  await recordAuditLog({
    userId: user.id,
    action: "SET_DEFAULT_AI_PROVIDER",
    entity: "AIProvider",
    entityId: providerId,
  });

  revalidatePath("/admin/settings/ai");
  revalidatePath("/admin/ai-studio");
  return { success: true };
}

/**
 * Toggles provider active state.
 */
export async function toggleAIProviderActiveAction(providerId: string) {
  await verifySuperAdmin();

  if (!(await isDatabaseAvailable())) {
    throw new Error("डेटाबेस उपलब्ध नाही.");
  }

  const provider = await prisma.aIProvider.findUnique({
    where: { id: providerId },
  });

  if (!provider) {
    throw new Error("AI Provider सापडला नाही.");
  }

  await prisma.aIProvider.update({
    where: { id: providerId },
    data: { isActive: !provider.isActive },
  });

  revalidatePath("/admin/settings/ai");
  revalidatePath("/admin/ai-studio");
  return { success: true, isActive: !provider.isActive };
}

/**
 * Tests a provider's live connection.
 */
export async function testAIProviderAction(providerId: string): Promise<AITestResult> {
  await verifySuperAdmin();

  if (!(await isDatabaseAvailable())) {
    throw new Error("डेटाबेस उपलब्ध नाही.");
  }

  const provider = await prisma.aIProvider.findUnique({
    where: { id: providerId },
  });

  if (!provider) {
    throw new Error("AI Provider सापडला नाही.");
  }

  const plainKey = decryptApiKey(provider.apiKeyEncrypted);

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

  // Update status in database
  await prisma.aIProvider.update({
    where: { id: providerId },
    data: {
      lastTestedAt: new Date(),
      lastTestStatus: testResult.success ? "SUCCESS" : "FAILED",
      lastTestError: testResult.error || null,
    },
  });

  revalidatePath("/admin/settings/ai");
  return testResult;
}

/**
 * Aggregates AI token usage statistics.
 */
export async function getAIUsageStatsAction() {
  try {
    await verifySuperAdmin();

    if (!(await isDatabaseAvailable())) {
      return {
        totalRequests: 0,
        totalTokens: 0,
        successfulRequests: 0,
        fallbackRequests: 0,
      };
    }

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

