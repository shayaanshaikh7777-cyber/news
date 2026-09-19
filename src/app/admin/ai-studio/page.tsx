import React from "react";
import prisma, { isDatabaseAvailable } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AIStudioClient from "@/components/admin/AIStudioClient";

export const dynamic = "force-dynamic";

export default async function AINewsStudioPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  let categories: Array<{ id: string; name: string; nameMarathi: string }> = [];

  if (await isDatabaseAvailable()) {
    try {
      categories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          nameMarathi: true,
        },
      });
    } catch (e) {
      console.error("[AIStudioPage DB query error]", e);
    }
  }

  // Fallback categories if table is empty or offline
  if (categories.length === 0) {
    categories = [
      { id: "cat-jamkhed", name: "Jamkhed", nameMarathi: "जामखेड विशेष" },
      { id: "cat-politics", name: "Politics", nameMarathi: "राजकारण" },
      { id: "cat-agriculture", name: "Agriculture", nameMarathi: "शेती व हवामान" },
      { id: "cat-crime", name: "Crime", nameMarathi: "गुन्हेगारी" },
      { id: "cat-sports", name: "Sports", nameMarathi: "क्रीडा" },
    ];
  }

  return <AIStudioClient categories={categories} />;
}
