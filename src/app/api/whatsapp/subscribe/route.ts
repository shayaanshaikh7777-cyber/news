import { NextRequest, NextResponse } from "next/server";
import { subscribeWhatsApp } from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, location, preferredCategories, consent } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "नाव आणि फोन नंबर आवश्यक आहेत." },
        { status: 400 }
      );
    }

    const subscriber = await subscribeWhatsApp({
      name,
      phone,
      location,
      preferredCategories,
      consent: !!consent,
    });

    return NextResponse.json({ success: true, subscriber });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "त्रुटी आली.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

