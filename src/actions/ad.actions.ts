"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function createAdAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !isSuperAdmin(user.role)) {
    return;
  }

  const advertiser = formData.get("advertiser") as string;
  const bannerUrl = formData.get("bannerUrl") as string;
  const destinationUrl = formData.get("destinationUrl") as string;
  const placement = formData.get("placement") as string;
  const weight = Number(formData.get("weight") || 1);
  const campaignRevenue = Number(formData.get("campaignRevenue") || 0);

  if (!advertiser || !bannerUrl || !destinationUrl) {
    return;
  }

  await prisma.advertisement.create({
    data: {
      advertiser,
      bannerUrl,
      destinationUrl,
      placement,
      weight,
      campaignRevenue,
      isActive: true,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/ads");
  revalidatePath("/admin/revenue");
}

export async function toggleAdAction(id: string, active: boolean): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !isSuperAdmin(user.role)) {
    return;
  }

  await prisma.advertisement.update({
    where: { id },
    data: { isActive: active },
  });

  revalidatePath("/");
  revalidatePath("/admin/ads");
}

export async function deleteAdAction(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !isSuperAdmin(user.role)) {
    return;
  }

  await prisma.advertisement.delete({
    where: { id },
  });

  revalidatePath("/");
  revalidatePath("/admin/ads");
}
