import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const text = await req.text();
    if (!text) return NextResponse.json({ ok: false });

    const { articleId, durationSeconds } = JSON.parse(text);
    if (!articleId || !durationSeconds) {
      return NextResponse.json({ ok: false });
    }

    // Update reading time if meaningful
    const readMinutes = Math.max(1, Math.round(durationSeconds / 60));
    await prisma.article.update({
      where: { id: articleId },
      data: { readingTimeMinutes: readMinutes },
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

