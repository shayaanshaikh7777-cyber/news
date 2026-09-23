import { GraphicOverlayItem, GraphicType, NewsFontKey } from "@/types/video-studio";

export const NEWS_GRAPHIC_FONTS: Record<NewsFontKey, { name: string; css: string }> = {
  "tiro-press": {
    name: "Tiro Devanagari Marathi — Press",
    css: "'Tiro Devanagari Marathi', 'Rozha One', serif",
  },
  mukta: {
    name: "Mukta (Modern Press)",
    css: "'Mukta', sans-serif",
  },
  "noto-serif": {
    name: "Noto Serif Devanagari — Editorial",
    css: "'Noto Serif Devanagari', serif",
  },
  "noto-sans": {
    name: "Noto Sans Devanagari — Clean News",
    css: "'Noto Sans Devanagari', sans-serif",
  },
};

export interface GraphicTypeDefinition {
  type: GraphicType;
  labelMarathi: string;
  labelEnglish: string;
  defaultTitle: string;
  defaultSubtitle?: string;
  defaultDuration: number;
  badge: string;
}

export const GRAPHIC_TYPE_DEFINITIONS: Record<GraphicType, GraphicTypeDefinition> = {
  "lower-third": {
    type: "lower-third",
    labelMarathi: "लोअर थर्ड (बातमीदार / अतिथी)",
    labelEnglish: "Lower Third",
    defaultTitle: "नासिर पठाण",
    defaultSubtitle: "विशेष वार्ताहर, जामखेड",
    defaultDuration: 8,
    badge: "प्रतिनिधी",
  },
  "location-tag": {
    type: "location-tag",
    labelMarathi: "स्थान दर्शक (Location Tag)",
    labelEnglish: "Location Tag",
    defaultTitle: "📍 जामखेड",
    defaultSubtitle: "अहिल्यानगर जिल्हा",
    defaultDuration: 10,
    badge: "स्थान",
  },
  "breaking-bar": {
    type: "breaking-bar",
    labelMarathi: "ब्रेकिंग न्यूज पट्टी (Breaking Strip)",
    labelEnglish: "Breaking News Bar",
    defaultTitle: "🔴 मोठी बातमी: जामखेड बाजार समितीत हरभऱ्याची विक्रमी आवक",
    defaultSubtitle: "शेतकऱ्यांमध्ये उत्साहाचे वातावरण",
    defaultDuration: 20,
    badge: "ब्रेकिंग",
  },
  "running-ticker": {
    type: "running-ticker",
    labelMarathi: "धावणारा टिकर (Running News Ticker)",
    labelEnglish: "Running News Ticker",
    defaultTitle: "🔴 आवाज जामखेडचा • जामखेड आणि पंचक्रोशीतील ताज्या घडामोडी • निष्पक्ष आणि निर्भीड पत्रकारिता • awaazjamkhed.com",
    defaultDuration: 60,
    badge: "टिकर",
  },
  "headline-card": {
    type: "headline-card",
    labelMarathi: "ठळक मथळा कार्ड (Headline Overlay)",
    labelEnglish: "Headline Card",
    defaultTitle: "खर्डा ऐतिहासिक किल्ल्याच्या संवर्धनासाठी ग्रामस्थांचे श्रमदान",
    defaultSubtitle: "युवकांनी हाती घेतला ऐतिहासिक वारसा जतन करण्याचा संकल्प",
    defaultDuration: 8,
    badge: "मथळा",
  },
  "subheadline-card": {
    type: "subheadline-card",
    labelMarathi: "उपमथळा (Subheadline Card)",
    labelEnglish: "Subheadline Card",
    defaultTitle: "स्थानिक प्रशासनाचे दुर्लक्ष; नागरिकांमध्ये संतापाची लाट",
    defaultDuration: 6,
    badge: "उपमथळा",
  },
  "quote-card": {
    type: "quote-card",
    labelMarathi: "अवतरण कोट कार्ड (Quote Card)",
    labelEnglish: "Quote Card",
    defaultTitle: "स्थानिक शेतकऱ्यांना वेळेवर वीज आणि पाणी मिळणे हा त्यांचा मूलभूत हक्क आहे.",
    defaultSubtitle: "— शेतकरी प्रतिनिधी",
    defaultDuration: 8,
    badge: "कोट",
  },
  "info-box": {
    type: "info-box",
    labelMarathi: "माहिती बॉक्स (Information Box)",
    labelEnglish: "Information Box",
    defaultTitle: "महत्त्वाचे मुद्दे व आकडेवारी",
    defaultSubtitle: "• आवक: २५०० क्विंटल\n• हमीभाव: ५४४० रु.",
    defaultDuration: 10,
    badge: "तपशील",
  },
  "live-badge": {
    type: "live-badge",
    labelMarathi: "लाईव्ह बॅज (Live Bug)",
    labelEnglish: "Live Badge",
    defaultTitle: "● LIVE",
    defaultSubtitle: "जामखेड",
    defaultDuration: 60,
    badge: "लाईव्ह",
  },
  "exclusive-badge": {
    type: "exclusive-badge",
    labelMarathi: "एक्सक्लुझिव्ह बॅज (Exclusive Bug)",
    labelEnglish: "Exclusive Badge",
    defaultTitle: "EXCLUSIVE",
    defaultSubtitle: "आवाज जामखेडचा विशेष",
    defaultDuration: 60,
    badge: "खास",
  },
  "logo-watermark": {
    type: "logo-watermark",
    labelMarathi: "लोगो वॉटरमार्क (Logo Bug)",
    labelEnglish: "Logo Watermark",
    defaultTitle: "आवाज जामखेडचा",
    defaultSubtitle: "डिजिटल न्यूजरूम",
    defaultDuration: 60,
    badge: "लोगो",
  },
  caption: {
    type: "caption",
    labelMarathi: "सबटायटल्स / कॅप्शन (Subtitles)",
    labelEnglish: "Caption",
    defaultTitle: "घटनेची माहिती मिळताच पोलीस पथक तात्काळ घटनास्थळी दाखल झाले.",
    defaultDuration: 5,
    badge: "कॅप्शन",
  },
  "end-screen": {
    type: "end-screen",
    labelMarathi: "अंतिम पडदा (End Screen)",
    labelEnglish: "End Screen",
    defaultTitle: "आवाज जामखेडचा डिजिटल न्यूजरूम",
    defaultSubtitle: "लाइक, शेअर आणि सबस्क्राईब करा • awaazjamkhed.com",
    defaultDuration: 5,
    badge: "एंड कार्ड",
  },
};
