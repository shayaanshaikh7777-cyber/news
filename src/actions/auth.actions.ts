"use server";

import { loginUser, logoutUser, getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { recordAuditLog } from "@/lib/audit";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "कृपया ईमेल आणि पासवर्ड दोन्ही प्रविष्ट करा." };
  }

  const result = await loginUser(email, password);

  if (result.success && result.user) {
    await recordAuditLog({
      userId: result.user.id,
      action: "USER_LOGIN",
      entity: "User",
      entityId: result.user.id,
      details: { email: result.user.email, role: result.user.role },
    });
    return { success: true };
  }

  return { success: false, error: result.error || "लॉगिन अयशस्वी." };
}

export async function logoutAction() {
  const user = await getCurrentUser();
  if (user) {
    await recordAuditLog({
      userId: user.id,
      action: "USER_LOGOUT",
      entity: "User",
      entityId: user.id,
    });
  }
  await logoutUser();
  redirect("/admin/login");
}

