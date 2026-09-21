import { MarathiFontFamily, PresetFontSize, TextAlignment } from "@/types/newspaper";

export interface FontOption {
  id: MarathiFontFamily;
  nameMarathi: string;
  nameEnglish: string;
  cssFamily: string;
  category: "headline" | "body" | "all";
  description: string;
}

export const MARATHI_FONTS: Record<MarathiFontFamily, FontOption> = {
  "tiro-press": {
    id: "tiro-press",
    nameMarathi: "तिरो देवनागरी मराठी (प्रेस / वृत्तपत्र)",
    nameEnglish: "Tiro Devanagari Marathi — Press",
    cssFamily: "'Tiro Devanagari Marathi', 'Rozha One', serif",
    category: "headline",
    description: "पारंपरिक प्रादेशिक वृत्तपत्र शैली, भारदस्त व स्पष्ट मराठी वृत्त मथळे",
  },
  mukta: {
    id: "mukta",
    nameMarathi: "मुक्ता (आधुनिक व स्वच्छ)",
    nameEnglish: "Mukta (Modern Press)",
    cssFamily: "'Mukta', 'Noto Sans Devanagari', sans-serif",
    category: "all",
    description: "आधुनिक वृत्तपत्र, उपशीर्षके आणि ठळक मजकुरासाठी सर्वोत्तम",
  },
  "noto-serif": {
    id: "noto-serif",
    nameMarathi: "नोटो सेरिफ देवनागरी (संपादकीय मजकूर)",
    nameEnglish: "Noto Serif Devanagari — Editorial",
    cssFamily: "'Noto Serif Devanagari', 'Georgia', serif",
    category: "body",
    description: "वर्तमानपत्रातील सविस्तर बातम्या आणि स्तंभासाठी क्लासिक सेरिफ",
  },
  "noto-sans": {
    id: "noto-sans",
    nameMarathi: "नोटो सॅन्स देवनागरी (वाचनीय बातमी मजकूर)",
    nameEnglish: "Noto Sans Devanagari — Clean News",
    cssFamily: "'Noto Sans Devanagari', -apple-system, sans-serif",
    category: "all",
    description: "उच्च डिजिटल वाचनीयता, बातमी तपशील व कॅप्शनसाठी उपयुक्त",
  },
};

export const PRESET_FONT_SIZES: Record<PresetFontSize, { px: number; label: string }> = {
  display: { px: 36, label: "ठळक मथळा (Display 36px)" },
  xl: { px: 26, label: "मोठा मथळा (XL 26px)" },
  large: { px: 20, label: "उपशीर्षक (Large 20px)" },
  normal: { px: 14, label: "सामान्य मजकूर (Normal 14px)" },
  small: { px: 12, label: "लहान वृत्त (Small 12px)" },
  fine: { px: 10, label: "कॅप्शन / क्रेडिट (Fine 10px)" },
};

export const ALIGNMENT_LABELS: Record<TextAlignment, string> = {
  left: "डावीकडे (Left)",
  center: "मध्यभागी (Center)",
  right: "उजवीकडे (Right)",
  justify: "दोनही बाजूने समान (Justify)",
};

/**
 * Returns complete CSS style string for a given font config
 */
export function getFontStyles(
  fontFamily: MarathiFontFamily = "noto-sans",
  fontSize: PresetFontSize = "normal",
  customPx?: number,
  alignment: TextAlignment = "justify",
  fontWeight: string = "normal",
  lineHeight?: number
): React.CSSProperties {
  const fontDef = MARATHI_FONTS[fontFamily] || MARATHI_FONTS["noto-sans"];
  const sizePx = customPx || PRESET_FONT_SIZES[fontSize]?.px || 14;

  return {
    fontFamily: fontDef.cssFamily,
    fontSize: `${sizePx}px`,
    textAlign: alignment,
    fontWeight: fontWeight === "black" ? 900 : fontWeight === "bold" ? 700 : fontWeight === "medium" ? 600 : 400,
    lineHeight: lineHeight || (sizePx > 24 ? 1.25 : 1.6),
  };
}

/**
 * Global CSS link for loading all 4 Marathi newspaper fonts in canvas and export
 */
export const GOOGLE_FONTS_NEWSPAPER_URL =
  "https://fonts.googleapis.com/css2?family=Mukta:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700;800&family=Noto+Serif+Devanagari:wght@400;600;700;800&family=Rozha+One&family=Tiro+Devanagari+Marathi:ital@0;1&display=swap";

