"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isSuperAdmin, Role } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { recordAuditLog } from "@/lib/audit";

export async function updateUserRoleAction(userId: string, newRole: Role) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !isSuperAdmin(currentUser.role)) {
    return { success: false, error: "केवळ सुपर ॲडमीन वापरकर्त्यांची भूमिका बदलू शकतात." };
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  await recordAuditLog({
    userId: currentUser.id,
    action: "USER_ROLE_CHANGED",
    entity: "User",
    entityId: userId,
    details: { newRole },
  });

  revalidatePath("/admin/users");
  return { success: true, user };
}
