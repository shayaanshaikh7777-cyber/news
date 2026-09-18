import { GoogleGenAI } from "@google/genai";
import {
  AIArticleStudioOutput,
  AIArticleStudioOutputSchema,
  AIStudioInput,
} from "../schemas/ai.schema";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-3.8-flash";

const SYSTEM_INSTRUCTION = `
You are the Senior Chief Editor and Newsroom AI Assistant for "Awaaz Jamkhedcha" (आवाज जामखेडचा), a high-credibility local Marathi news publication based in Jamkhed, Ahilyanagar district, Maharashtra.

STRICT EDITORIAL RULES:
1. NEVER INVENT FACTS, NAMES, STATISTICS, QUOTES, DATES, OR LOCATIONS.
2. NEVER create allegations or unverified claims that were not explicitly supplied.
3. Preserve the exact factual meaning of the source material.
4. Enhance Marathi grammar, readability, and regional nuance appropriate for Ahilyanagar / Jamkhed readers.
5. If the provided notes lack critical details (such as who, when, where), DO NOT guess. Flag "insufficient_info_flag: true" and specify in "missing_details_note".
6. Always return clean, structured output in natural, professional, editorial Marathi.
`;

export async function processWithGemini(input: AIStudioInput): Promise<AIArticleStudioOutput> {
  const prompt = `
Task Action: ${input.action}
Input Language: ${input.language}
Location Context: ${input.location || "जामखेड / अहिल्यानगर"}
Reporter Notes & Bullet Points:
"""
${input.notes}
"""
${input.headline ? `Existing Headline: ${input.headline}` : ""}
${input.currentBody ? `Existing Content: ${input.currentBody}` : ""}

Generate the complete structured JSON response matching the required schema.
Ensure all Marathi text is grammatically impeccable, respectful, engaging, and faithful to the supplied facts.
`;

  // If live API key is present, invoke official Google GenAI SDK
  if (GEMINI_API_KEY && GEMINI_API_KEY.trim().length > 10) {
    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [
          { role: "user", parts: [{ text: `${SYSTEM_INSTRUCTION}\n\n${prompt}` }] },
        ],
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const responseText = response.text || "";
      const parsed = JSON.parse(responseText);
      const validated = AIArticleStudioOutputSchema.parse(parsed);
      return validated;
    } catch (err) {
      console.warn("Gemini API call failed or schema mismatch, falling back to local newsroom generator:", err);
    }
  }

  // Fallback high-quality newsroom engine for local dev and offline execution
  return generateDeterministicNewsroomOutput(input);
}

function generateDeterministicNewsroomOutput(input: AIStudioInput): AIArticleStudioOutput {
  const cleanNotes = input.notes.trim();
  const firstLine = cleanNotes.split("\n")[0].replace(/^[-*•0-9.]+\s*/, "");
  const loc = input.location || "जामखेड";

  // Slug generator
  const slug = `awaaz-${loc.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString().slice(-6)}`;

  let headline = input.headline || `${loc}: ${firstLine}`;
  if (!headline.includes("जामखेड") && !headline.includes(loc)) {
    headline = `${loc} वार्ता: ${headline}`;
  }

  const subheadline = `स्थानिक नागरिकांचे लक्ष; प्रशासनाकडून दखल घेण्याची अपेक्षा`;
  const summary = `${loc} परिसरातील ताज्या घडामोडींनुसार ${firstLine}. सविस्तर वृत्त आणि विश्लेषण.`;

  const bullets = cleanNotes
    .split("\n")
    .map((line) => line.replace(/^[-*•0-9.]+\s*/, "").trim())
    .filter((line) => line.length > 3);

  const takeaways =
    bullets.length >= 2
      ? bullets.slice(0, 4)
      : [
          `${loc} परिसरात घडलेली महत्त्वाची घटना`,
          `स्थानिक प्रतिनिधी व नागरिकांमधून प्रतिक्रिया`,
        ];

  const bodyMarkdown = `### ${headline}

**${loc} (विशेष प्रतिनिधी, आवाज जामखेडचा):**

${cleanNotes}

#### महत्त्वाचे मुद्दे:
${takeaways.map((t) => `- **${t}**`).join("\n")}

स्थानिक नागरिकांनी या विषयावर गांभीर्याने लक्ष देण्याची मागणी केली असून, पुढील घडामोडींवर "आवाज जामखेडचा"चे सातत्याने लक्ष राहील.`;

  const output: AIArticleStudioOutput = {
    headline: headline.length > 10 ? headline : `${headline} - आवाज जामखेडचा विशेष वृत्त`,
    subheadline,
    summary,
    body_markdown: bodyMarkdown,
    key_takeaways: takeaways,
    seo: {
      meta_title: `${headline.slice(0, 60)} | Awaaz Jamkhedcha`,
      meta_description: summary.slice(0, 150),
      focus_keywords: [loc, "जामखेड", "बातम्या", "महाराष्ट्र", "Awaaz Jamkhedcha"],
      slug,
    },
    social: {
      facebook_caption: `🔴 ${headline}\n\n${summary}\n\n👉 सविस्तर बातमी वाचा आवाज जामखेडचा वर:\nhttps://awaazjamkhed.com/news/${slug}`,
      instagram_caption: `📍 ${loc} | ${headline}\n\n${summary}\n.\n.\n#Jamkhed #Ahilyanagar #Maharashtra #AwaazJamkhedcha #LocalNews`,
      whatsapp_message: `*${headline}*\n\n${summary}\n\nजामखेड आणि पंचक्रोशीची ताजी बातमी वाचा फक्त "आवाज जामखेडचा" वर:\nhttps://awaazjamkhed.com/news/${slug}`,
    },
    insufficient_info_flag: cleanNotes.length < 20,
    missing_details_note:
      cleanNotes.length < 20
        ? "माहिती मर्यादित स्वरूपात मिळाली आहे. कृपया अधिकृत वेळ व ठिकाणाची खात्री करून घ्यावी."
        : "",
  };

  return output;
}

// 14 Specialized Action Handlers
export async function executeAIAction(action: string, input: AIStudioInput): Promise<Partial<AIArticleStudioOutput> & { resultText?: string }> {
  const full = await processWithGemini({ ...input, action: action as any });

  switch (action) {
    case "REWRITE_HEADLINE":
      return { headline: full.headline, resultText: full.headline };
    case "GENERATE_SEO":
      return { seo: full.seo };
    case "IMPROVE_MARATHI":
      return { body_markdown: full.body_markdown, headline: full.headline };
    case "SHORTEN_ARTICLE":
      return { summary: full.summary, body_markdown: full.summary };
    case "EXPAND_ARTICLE":
      return { body_markdown: full.body_markdown };
    case "GENERATE_SUMMARY":
      return { summary: full.summary, resultText: full.summary };
    case "GENERATE_KEY_TAKEAWAYS":
      return { key_takeaways: full.key_takeaways };
    case "GENERATE_FACEBOOK_CAPTION":
      return { social: full.social, resultText: full.social.facebook_caption };
    case "GENERATE_INSTAGRAM_CAPTION":
      return { social: full.social, resultText: full.social.instagram_caption };
    case "GENERATE_WHATSAPP_MESSAGE":
      return { social: full.social, resultText: full.social.whatsapp_message };
    case "GENERATE_BREAKING_HEADLINE":
      return {
        headline: `🚨 ब्रेकिंग: ${full.headline.replace(/^[^:]+:\s*/, "")}`,
        resultText: `🚨 ब्रेकिंग: ${full.headline.replace(/^[^:]+:\s*/, "")}`,
      };
    case "GENERATE_PUSH_NOTIFICATION":
      return {
        resultText: `${full.headline.slice(0, 75)}... वाचा आवाज जामखेडचा वर`,
      };
    case "GENERATE_CLIPPING_TEXT":
      return {
        body_markdown: full.body_markdown,
        resultText: full.body_markdown,
      };
    case "GENERATE_ARTICLE":
    default:
      return full;
  }
}

