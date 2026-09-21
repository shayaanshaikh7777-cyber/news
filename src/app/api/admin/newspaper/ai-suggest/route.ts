import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isReporter } from "@/lib/rbac";
import { suggestNewspaperLayoutWithAI } from "@/lib/newspaper/ai-layout";
import { ArticleSummaryItem } from "@/types/newspaper";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isReporter(user.role)) {
      return NextResponse.json({ error: "अनधिकृत वापर. कृपया लॉगिन करा." }, { status: 401 });
    }

    const body = await req.json();
    const articles: ArticleSummaryItem[] = body.articles;

    if (!Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json({ error: "कृपया किमान १ बातमी निवडा." }, { status: 400 });
    }

    const plan = await suggestNewspaperLayoutWithAI(articles, { userId: user.id });

    return NextResponse.json({
      success: true,
      data: plan,
    });
  } catch (err: unknown) {
    console.error("[api/admin/newspaper/ai-suggest] Error:", err);
    const msg = err instanceof Error ? err.message : "AI रचना तयार करताना त्रुटी आली.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

