"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isSuperAdmin, isEditor } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { recordAuditLog } from "@/lib/audit";

export async function createCategoryAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !isSuperAdmin(user.role)) {
    return;
  }

  const name = formData.get("name") as string;
  const nameMarathi = formData.get("nameMarathi") as string;
  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string;

  if (!name || !nameMarathi || !slug) {
    return;
  }

  try {
    await prisma.category.create({
      data: { name, nameMarathi, slug: slug.toLowerCase().trim(), description },
    });

    revalidatePath("/");
    revalidatePath("/admin/categories");
  } catch (err: any) {
    console.error("[createCategoryAction error]:", err?.message);
  }
}

export async function createLocationAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !isSuperAdmin(user.role)) {
    return;
  }

  const district = formData.get("district") as string;
  const taluka = formData.get("taluka") as string;
  const village = formData.get("village") as string;
  const slug = formData.get("slug") as string;
  const isHotspot = formData.get("isHotspot") === "true";

  if (!district || !taluka || !village || !slug) {
    return;
  }

  try {
    await prisma.location.create({
      data: {
        district,
        taluka,
        village,
        slug: slug.toLowerCase().trim(),
        isHotspot,
      },
    });

    revalidatePath("/");
    revalidatePath("/admin/locations");
  } catch (err: any) {
    console.error("[createLocationAction error]:", err?.message);
  }
}

export async function updateSiteSettingsAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !isSuperAdmin(user.role)) {
    return;
  }

  const entries = Array.from(formData.entries());

  try {
    for (const [key, value] of entries) {
      if (typeof value === "string") {
        await prisma.siteSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        });
      }
    }

    await recordAuditLog({
      userId: user.id,
      action: "SITE_SETTINGS_UPDATED",
      entity: "SiteSetting",
      details: { updatedKeys: entries.map(([k]) => k) },
    });

    revalidatePath("/");
    revalidatePath("/admin/settings");
  } catch (err: any) {
    console.error("[updateSiteSettingsAction error]:", err?.message);
  }
}
