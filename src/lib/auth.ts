import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
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

export const MASTER_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@test.com";
export const MASTER_ADMIN_PASS = process.env.ADMIN_PASSWORD || "Aa@12345";

export type VerifiedUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: string;
  avatar: string | null;
  reporterProfileId: string | null;
};

type DbUserWithProfile = Prisma.UserGetPayload<{
  include: { reporterProfile: true };
}>;

/**
 * Resolves and verifies that a user identity exists and is active in PostgreSQL.
 *
 * Safety guarantees:
 * 1. Checks primary key ID first (rejecting obsolete 'admin-master' tokens).
 * 2. Falls back to verified email resolution for existing accounts with refreshed/legacy tokens.
 * 3. Only auto-provisions if the user strictly matches configured MASTER_ADMIN_EMAIL,
 *    using environment configuration and generating a genuine PostgreSQL CUID.
 * 4. Never auto-provisions arbitrary users based on email.
 * 5. Guarantees returned `id` is a real, foreign-key-valid User.id from PostgreSQL.
 */
export async function verifyDatabaseUser(
  userId?: string | null,
  email?: string | null
): Promise<VerifiedUser | null> {
  if (!userId && !email) return null;

  try {
    let dbUser: DbUserWithProfile | null = null;

    // 1. Lookup by primary key ID if valid and not legacy fallback
    if (userId && userId !== "admin-master") {
      dbUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { reporterProfile: true },
      });
    }

    // 2. If not resolved by ID, lookup by unique email
    if (!dbUser && email) {
      const cleanEmail = email.toLowerCase().trim();
      dbUser = await prisma.user.findUnique({
        where: { email: cleanEmail },
        include: { reporterProfile: true },
      });
    }

    // 3. Explicit Master Admin provisioning if database is unseeded
    if (!dbUser && email) {
      const cleanEmail = email.toLowerCase().trim();
      if (cleanEmail === MASTER_ADMIN_EMAIL.toLowerCase().trim()) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(MASTER_ADMIN_PASS, salt);
        dbUser = await prisma.user.upsert({
          where: { email: cleanEmail },
          update: { role: "SUPER_ADMIN", status: "ACTIVE" },
          create: {
            name: "मुख्य संपादक (Master Admin)",
            email: cleanEmail,
            passwordHash: hash,
            role: "SUPER_ADMIN",
            status: "ACTIVE",
          },
          include: { reporterProfile: true },
        });
      }
    }

    // 4. Verify account is active
    if (!dbUser || dbUser.status !== "ACTIVE") {
      return null;
    }

    return {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role as Role,
      status: dbUser.status,
      avatar: dbUser.avatar,
      reporterProfileId: dbUser.reporterProfile?.id || null,
    };
  } catch (err: unknown) {
    console.error("[verifyDatabaseUser error]:", err);
    return null;
  }
}

/**
 * Retrieves the current authenticated user by validating the session cookie
 * against the PostgreSQL database. Guarantees session.id corresponds to a
 * verified User row in PostgreSQL.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded || !decoded.email) return null;

    const verified = await verifyDatabaseUser(decoded.id, decoded.email);
    if (!verified) {
      return null;
    }

    return {
      id: verified.id,
      name: verified.name,
      email: verified.email,
      role: verified.role,
      avatar: verified.avatar,
      reporterProfileId: verified.reporterProfileId,
    };
  } catch (err: unknown) {
    if (err && typeof err === "object" && "digest" in err && (err as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE") {
      throw err;
    }
    console.error("[getCurrentUser error]:", err);
    return null;
  }
}

/**
 * Authenticates user credentials and sets an HTTP-only session cookie.
 * Always resolves and stores genuine PostgreSQL User.id in the JWT payload.
 */
export async function loginUser(
  email: string,
  passwordPlain: string
): Promise<{ success: boolean; user?: SessionUser; error?: string }> {
  try {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !passwordPlain) {
      return { success: false, error: "ईमेल आणि पासवर्ड आवश्यक आहेत." };
    }

    // 1. Master Admin login with configured credentials
    if (cleanEmail === MASTER_ADMIN_EMAIL.toLowerCase().trim() && passwordPlain === MASTER_ADMIN_PASS) {
      let masterUser = await prisma.user.findUnique({
        where: { email: cleanEmail },
        include: { reporterProfile: true },
      });

      if (!masterUser) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(MASTER_ADMIN_PASS, salt);
        masterUser = await prisma.user.create({
          data: {
            name: "मुख्य संपादक (Master Admin)",
            email: cleanEmail,
            passwordHash: hash,
            role: "SUPER_ADMIN",
            status: "ACTIVE",
          },
          include: { reporterProfile: true },
        });
      } else {
        if (masterUser.status !== "ACTIVE" || masterUser.role !== "SUPER_ADMIN") {
          masterUser = await prisma.user.update({
            where: { id: masterUser.id },
            data: { status: "ACTIVE", role: "SUPER_ADMIN" },
            include: { reporterProfile: true },
          });
        }
      }

      const sessionUser: SessionUser = {
        id: masterUser.id,
        name: masterUser.name,
        email: masterUser.email,
        role: "SUPER_ADMIN",
        avatar: masterUser.avatar,
        reporterProfileId: masterUser.reporterProfile?.id || null,
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
    }

    // 2. Standard user authentication via PostgreSQL
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
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
    console.error("[loginUser error]:", err);
    const msg = err instanceof Error ? err.message : "लॉगिन करताना त्रुटी आली.";
    return { success: false, error: msg };
  }
}

export async function logoutUser(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
