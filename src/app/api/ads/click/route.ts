import { NextRequest, NextResponse } from "next/server";
import { recordAdClick } from "@/lib/ads";
import { analyticsBuffer } from "@/lib/analytics-buffer";

export async function POST(req: NextRequest) {
  try {
    const { adId } = await req.json();
    if (!adId) return NextResponse.json({ ok: false }, { status: 400 });

    const userAgent = req.headers.get("user-agent") || "";
    if (analyticsBuffer.isBot(userAgent)) {
      return NextResponse.json({ ok: true, ignored: "bot" });
    }

    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "127.0.0.1";
    const visitorHash = analyticsBuffer.generateVisitorHash(ip, userAgent);

    await recordAdClick(adId, visitorHash);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

