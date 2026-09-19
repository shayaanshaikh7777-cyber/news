import { AIArticleStudioOutput, AIStudioInput } from "./types";

/**
 * Deterministic local newsroom engine that guarantees 100% service uptime
 * and produces publication-ready Marathi content even when offline or during provider outages.
 */
export function generateDeterministicNewsroomOutput(input: AIStudioInput): AIArticleStudioOutput {
  const cleanNotes = input.notes.trim();
  const firstLine = cleanNotes.split("\n")[0].replace(/^[-*•0-9.]+\s*/, "");
  const loc = input.location || "जामखेड";

  // Slug generator with friendly transliteration
  const locationMap: Record<string, string> = {
    "जामखेड": "jamkhed",
    "खर्डा": "kharda",
    "नानज": "nanaj",
    "साकत": "sakat",
    "अहिल्यानगर": "ahilyanagar",
    "कर्जत": "karjat",
    "आष्टी": "ashti",
  };
  const locSlug = locationMap[loc] || loc.toLowerCase().replace(/[^a-z0-9]/g, "").trim() || "jamkhed";
  const slug = `awaaz-${locSlug}-${Date.now().toString().slice(-6)}`;

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
