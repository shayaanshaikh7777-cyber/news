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

export const MASTER_ADMIN_EMAIL = "admin@test.com";
export const MASTER_ADMIN_PASS = "Aa@12345";

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    // Master Admin fallback if DB is unseeded or offline
    if (decoded.email === MASTER_ADMIN_EMAIL) {
      return {
        id: decoded.id,
        name: decoded.name || "मुख्य संपादक (Master Admin)",
        email: MASTER_ADMIN_EMAIL,
        role: "SUPER_ADMIN",
        avatar: decoded.avatar,
        reporterProfileId: null,
      };
    }

    // Verify user in DB if DB is accessible
    try {
      if (process.env.DATABASE_URL) {
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
      }
    } catch {
      // If DB error, trust verified JWT token
      return {
        id: decoded.id,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
        avatar: decoded.avatar,
        reporterProfileId: decoded.reporterProfileId || null,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export async function loginUser(email: string, passwordPlain: string): Promise<{ success: boolean; user?: SessionUser; error?: string }> {
  try {
    const cleanEmail = email.toLowerCase().trim();

    // 1. Instant Master Admin login requested by user (admin@test.com / Aa@12345)
    if (cleanEmail === MASTER_ADMIN_EMAIL && passwordPlain === MASTER_ADMIN_PASS) {
      let masterId = "admin-master";
      try {
        if (process.env.DATABASE_URL) {
          const salt = await bcrypt.genSalt(10);
          const hash = await bcrypt.hash(MASTER_ADMIN_PASS, salt);
          const upserted = await prisma.user.upsert({
            where: { email: MASTER_ADMIN_EMAIL },
            update: { passwordHash: hash, role: "SUPER_ADMIN", status: "ACTIVE" },
            create: {
              name: "मुख्य संपादक (Master Admin)",
              email: MASTER_ADMIN_EMAIL,
              passwordHash: hash,
              role: "SUPER_ADMIN",
              status: "ACTIVE",
            },
          });
          masterId = upserted.id;
        }
      } catch (err) {
        console.warn("DB master admin auto-provision skipped:", err);
      }

      const sessionUser: SessionUser = {
        id: masterId,
        name: "मुख्य संपादक (Master Admin)",
        email: MASTER_ADMIN_EMAIL,
        role: "SUPER_ADMIN",
        avatar: null,
        reporterProfileId: null,
      };

      const token = createToken({
        id: sessionUser.id,
        email: sessionUser.email,
        name: sessionUser.name,
        role: sessionUser.role,
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
    }

    let user: any = null;
    try {
      if (process.env.DATABASE_URL) {
        user = await prisma.user.findUnique({
          where: { email: cleanEmail },
          include: { reporterProfile: true },
        });
      }
    } catch {
      // ignore
    }

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

