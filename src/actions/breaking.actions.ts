"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isEditor } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { recordAuditLog } from "@/lib/audit";

export async function createBreakingNewsAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !isEditor(user.role)) {
    return;
  }

  const title = formData.get("title") as string;
  const linkUrl = (formData.get("linkUrl") as string) || null;
  const priority = Number(formData.get("priority") || 1);
  const expiresHours = Number(formData.get("expiresHours") || 24);

  if (!title || title.trim().length < 5) {
    return;
  }

  const expiresAt = new Date(Date.now() + expiresHours * 60 * 60 * 1000);

  const breaking = await prisma.breakingNews.create({
    data: {
      title,
      linkUrl,
      priority,
      isActive: true,
      expiresAt,
    },
  });

  await recordAuditLog({
    userId: user.id,
    action: "BREAKING_NEWS_CREATED",
    entity: "BreakingNews",
    entityId: breaking.id,
    details: { title, priority, expiresAt },
  });

  revalidatePath("/");
  revalidatePath("/admin/breaking");
}

export async function toggleBreakingNewsAction(id: string, active: boolean): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !isEditor(user.role)) {
    return;
  }

  await prisma.breakingNews.update({
    where: { id },
    data: { isActive: active },
  });

  revalidatePath("/");
  revalidatePath("/admin/breaking");
}

export async function deleteBreakingNewsAction(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !isEditor(user.role)) {
    return;
  }

  await prisma.breakingNews.delete({
    where: { id },
  });

  revalidatePath("/");
  revalidatePath("/admin/breaking");
}
