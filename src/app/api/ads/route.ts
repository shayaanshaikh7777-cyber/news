import { NextRequest, NextResponse } from "next/server";
import { getActiveAdForPlacement, AdPlacement } from "@/lib/ads";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const placement = (searchParams.get("placement") || "HEADER") as AdPlacement;
  const device = searchParams.get("device") || "ALL";

  const ad = await getActiveAdForPlacement({ placement, device });
  return NextResponse.json({ ad });
}

