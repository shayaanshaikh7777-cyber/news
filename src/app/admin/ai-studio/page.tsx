import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AIStudioClient from "@/components/admin/AIStudioClient";
import { getOrSeedCategories } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function AINewsStudioPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  // Load real categories from PostgreSQL, or auto-seed defaults if table is empty
  const categories = await getOrSeedCategories();

  return <AIStudioClient categories={categories} />;
}
