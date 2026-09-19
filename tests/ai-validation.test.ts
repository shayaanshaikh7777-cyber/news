import { describe, it, expect } from "vitest";
import {
  AIArticleStudioOutputSchema,
  AIStudioInputSchema,
  AIActionTypeSchema,
} from "../src/schemas/ai.schema";

describe("AI News Studio Zod Schemas & Structured Output Validation", () => {
  it("validates a compliant structured news output", () => {
    const validData = {
      headline: "जामखेड बाजार समितीत कांद्याला २,८०० रुपयांचा विक्रमी भाव",
      subheadline: "आवक वाढल्याने शेतकऱ्यांमध्ये समाधानाचे वातावरण",
      summary: "जामखेड कृषी उत्पन्न बाजार समितीत आज २५ हजार गोण्यांची विक्रमी आवक झाली असून उच्च भाव मिळाला आहे.",
      body_markdown: "### जामखेड विशेष वृत्त\n\nजामखेड बाजार समितीमध्ये आज कांद्याची विक्रमी आवक नोंदवण्यात आली. उच्च प्रतीच्या कांद्याला प्रतिक्विंटल २,८०० रुपयांचा दर मिळाला असून स्थानिक व परजिल्ह्यातील शेतकऱ्यांनी समाधान व्यक्त केले.",
      key_takeaways: [
        "कांद्याला प्रतिक्विंटल २,८०० रुपयांपर्यंत कमाल दर",
        "२५ हजार गोण्यांची विक्रमी आवक",
        "पारदर्शक वजन काटा प्रणालीमुळे शेतकऱ्यांचा विश्वास",
      ],
      seo: {
        meta_title: "जामखेड बाजार समितीत कांद्याला विक्रमी भाव | Awaaz Jamkhedcha",
        meta_description: "जामखेड कृषी उत्पन्न बाजार समितीत आज कांद्याची विक्रमी आवक झाली आणि उच्च भाव मिळाला.",
        focus_keywords: ["जामखेड", "कांदा बाजारभाव", "शेती"],
        slug: "jamkhed-apmc-onion-record-rates",
      },
      social: {
        facebook_caption: "🔴 जामखेड बाजार समितीत कांद्याला उच्च दर! सविस्तर बातमी वाचा आवाज जामखेडचा वर.",
        instagram_caption: "📍 जामखेड | कांदा बाजारभाव विक्रमी पातळीवर.",
        whatsapp_message: "*जामखेड बाजार समितीत कांद्याला २८०० चा भाव!*\n\nवाचा फक्त आवाज जामखेडचा वर:\nhttps://awaazjamkhed.com/news/onion",
      },
      insufficient_info_flag: false,
      missing_details_note: "",
    };

    const parseResult = AIArticleStudioOutputSchema.safeParse(validData);
    expect(parseResult.success).toBe(true);
  });

  it("fails validation if headline is too short or missing key takeaways", () => {
    const invalidData = {
      headline: "लहान", // Too short
      summary: "खूप लहान",
      body_markdown: "मजकूर",
      key_takeaways: ["फक्त एकच"], // Schema requires at least 2
      seo: {
        meta_title: "Title",
        meta_description: "Desc",
        focus_keywords: ["news"],
        slug: "slug",
      },
      social: {
        facebook_caption: "FB",
        instagram_caption: "Insta",
        whatsapp_message: "WA",
      },
    };

    const parseResult = AIArticleStudioOutputSchema.safeParse(invalidData);
    expect(parseResult.success).toBe(false);
  });

  it("verifies all 14 requested action buttons exist in AIActionTypeSchema", () => {
    const expectedActions = [
      "GENERATE_ARTICLE",
      "REWRITE_HEADLINE",
      "GENERATE_SEO",
      "IMPROVE_MARATHI",
      "SHORTEN_ARTICLE",
      "EXPAND_ARTICLE",
      "GENERATE_SUMMARY",
      "GENERATE_KEY_TAKEAWAYS",
      "GENERATE_FACEBOOK_CAPTION",
      "GENERATE_INSTAGRAM_CAPTION",
      "GENERATE_WHATSAPP_MESSAGE",
      "GENERATE_BREAKING_HEADLINE",
      "GENERATE_PUSH_NOTIFICATION",
      "GENERATE_CLIPPING_TEXT",
    ];

    expectedActions.forEach((action) => {
      const parsed = AIActionTypeSchema.safeParse(action);
      expect(parsed.success).toBe(true);
    });
  });

  it("validates AIStudioInputSchema accepts categoryId and imageUrl", () => {
    const inputWithMedia = {
      notes: "जामखेड कृषी उत्पन्न बाजार समितीमध्ये कांद्याची विक्रमी आवक.",
      location: "जामखेड",
      language: "marathi" as const,
      action: "GENERATE_ARTICLE" as const,
      categoryId: "cat-agriculture-123",
      imageUrl: "/uploads/media/jamkhed-market-2026.webp",
    };

    const parsed = AIStudioInputSchema.safeParse(inputWithMedia);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.categoryId).toBe("cat-agriculture-123");
      expect(parsed.data.imageUrl).toBe("/uploads/media/jamkhed-market-2026.webp");
    }
  });
});

