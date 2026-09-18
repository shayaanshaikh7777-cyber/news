import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import prisma from "./prisma";
import { SessionUser, Role } from "./rbac";

const JWT_SECRET = process.env.JWT_SECRET || "awaaz_jamkhedcha_default_secret_key_change_in_prod";
const COOKIE_NAME = "awaaz_session";

export interface JWTPayload {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar?: string | null;
  reporterProfileId?: string | null;
}

export function createToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    // Verify user is still active in DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { reporterProfile: true },
    });

    if (!user || user.status !== "ACTIVE") return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
      avatar: user.avatar,
      reporterProfileId: user.reporterProfile?.id || null,
    };
  } catch {
    return null;
  }
}

export async function loginUser(email: string, passwordPlain: string): Promise<{ success: boolean; user?: SessionUser; error?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { reporterProfile: true },
    });

    if (!user) {
      return { success: false, error: "ईमेल किंवा पासवर्ड चुकीचा आहे." };
    }

    if (user.status !== "ACTIVE") {
      return { success: false, error: "हे खाते निष्क्रिय करण्यात आले आहे." };
    }

    const isValid = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isValid) {
      return { success: false, error: "ईमेल किंवा पासवर्ड चुकीचा आहे." };
    }

    const sessionUser: SessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
      avatar: user.avatar,
      reporterProfileId: user.reporterProfile?.id || null,
    };

    const token = createToken({
      id: sessionUser.id,
      email: sessionUser.email,
      name: sessionUser.name,
      role: sessionUser.role,
      avatar: sessionUser.avatar,
      reporterProfileId: sessionUser.reporterProfileId,
    });

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return { success: true, user: sessionUser };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "लॉगिन करताना त्रुटी आली.";
    return { success: false, error: msg };
  }
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

