import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  // Only accessible in development mode. In production, returns a safe 404.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Diagnostics endpoint disabled in production" },
      { status: 404 }
    );
  }

  let dbConnected = false;
  try {
    if (process.env.DATABASE_URL) {
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
    }
  } catch {
    dbConnected = false;
  }

  return NextResponse.json({
    environment: process.env.NODE_ENV || "development",
    nodeVersion: process.version,
    nextVersion: "15.1.7",
    database: {
      connected: dbConnected,
      provider: "postgresql",
    },
    routes: [
      "/",
      "/news",
      "/news/[slug]",
      "/category/[slug]",
      "/location/[slug]",
      "/reporter/[id]",
      "/search",
      "/trending",
      "/epaper",
      "/breaking-news",
      "/video",
      "/about",
      "/contact",
      "/privacy-policy",
      "/terms",
      "/advertise",
      "/admin",
      "/admin/login",
      "/api/health",
    ],
    configStatus: {
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasGeminiApiKey: !!process.env.GEMINI_API_KEY,
      siteUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    },
  });
}

