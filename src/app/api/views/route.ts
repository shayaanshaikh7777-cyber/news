import { NextRequest, NextResponse } from "next/server";
import { analyticsBuffer } from "@/lib/analytics-buffer";

export async function POST(req: NextRequest) {
  try {
    const userAgent = req.headers.get("user-agent") || "";
    if (analyticsBuffer.isBot(userAgent)) {
      return NextResponse.json({ ok: true, ignored: "bot" });
    }

    const body = await req.json();
    const { articleId, referrer, device } = body;

    if (!articleId) {
      return NextResponse.json({ error: "articleId is required" }, { status: 400 });
    }

    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "127.0.0.1";
    const visitorHash = analyticsBuffer.generateVisitorHash(ip, userAgent);

    analyticsBuffer.recordView({
      articleId,
      visitorHash,
      referrer,
      device: device || "DESKTOP",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("View tracker error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

