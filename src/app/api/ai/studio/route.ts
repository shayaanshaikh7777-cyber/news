import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isReporter } from "@/lib/rbac";
import { aiGateway } from "@/lib/ai/gateway";
import { AIStudioInputSchema } from "@/schemas/ai.schema";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isReporter(user.role)) {
      return NextResponse.json({ error: "अनधिकृत वापर. कृपया लॉगिन करा." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = AIStudioInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "अवैध इनपुट", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await aiGateway.executeAction(parsed.data.action, parsed.data, {
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      action: parsed.data.action,
      data: result,
      provider: result.providerName,
      model: result.model,
      isFallback: result.isFallback,
      statusTag: "AI Assisted — Editor Verified",
    });
  } catch (err: unknown) {
    console.error("AI Studio route error:", err);
    const msg = err instanceof Error ? err.message : "AI प्रक्रिया करताना त्रुटी आली.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

