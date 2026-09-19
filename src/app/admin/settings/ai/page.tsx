import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/rbac";
import { redirect } from "next/navigation";
import {
  getAIProvidersAction,
  getAIUsageStatsAction,
} from "@/actions/ai-provider.actions";
import AIProviderManager from "./AIProviderManager";

export const dynamic = "force-dynamic";

export default async function AdminAISettingsPage() {
  const user = await getCurrentUser();
  if (!user || !isSuperAdmin(user.role)) {
    redirect("/admin");
  }

  const providers = await getAIProvidersAction();
  const stats = await getAIUsageStatsAction();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <AIProviderManager initialProviders={providers} stats={stats} />
    </div>
  );
}

