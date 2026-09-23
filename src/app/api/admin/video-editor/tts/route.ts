import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isReporter } from "@/lib/rbac";
import { generateElevenLabsVoice } from "@/lib/video-editor/elevenlabs";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isReporter(user.role)) {
      return NextResponse.json(
        { error: "अनधिकृत वापर. कृपया व्हिडिओ स्टुडिओसाठी लॉगिन करा." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { text, voiceId } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "व्हॉइसओव्हर तयार करण्यासाठी मराठी मजकूर आवश्यक आहे." },
        { status: 400 }
      );
    }

    const result = await generateElevenLabsVoice({ text, voiceId });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      audioUrl: result.audioUrl,
      durationSeconds: result.durationSeconds,
      isMockFallback: result.isMockFallback,
    });
  } catch (err: unknown) {
    console.error("[api/admin/video-editor/tts] Error:", err);
    const msg = err instanceof Error ? err.message : "तांत्रिक अडचण आली.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
