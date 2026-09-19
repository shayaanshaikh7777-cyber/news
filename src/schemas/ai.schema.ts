import { z } from "zod";

export const AISEOOutputSchema = z.object({
  meta_title: z.string().min(10).max(100),
  meta_description: z.string().min(20).max(200),
  focus_keywords: z.array(z.string()).min(1).max(10),
  slug: z.string().min(5).max(120),
});

export const AISocialOutputSchema = z.object({
  facebook_caption: z.string().min(10),
  instagram_caption: z.string().min(10),
  whatsapp_message: z.string().min(10),
});

export const AIArticleStudioOutputSchema = z.object({
  headline: z.string().min(10, "शीर्षक किमान १० अक्षरांचे असावे"),
  subheadline: z.string().optional().default(""),
  summary: z.string().min(15, "सारांश किमान १५ अक्षरांचा असावा"),
  body_markdown: z.string().min(50, "मुख्य बातमी किमान ५० अक्षरांची असावी"),
  key_takeaways: z.array(z.string()).min(2, "किमान २ महत्त्वाचे मुद्दे हवेत"),
  seo: AISEOOutputSchema,
  social: AISocialOutputSchema,
  insufficient_info_flag: z.boolean().optional().default(false),
  missing_details_note: z.string().optional().default(""),
});

export type AIArticleStudioOutput = z.infer<typeof AIArticleStudioOutputSchema>;

export const AIActionTypeSchema = z.enum([
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
]);

export type AIActionType = z.infer<typeof AIActionTypeSchema>;

export const AIStudioInputSchema = z.object({
  notes: z.string().min(5, "कृपया किमान ५ अक्षरांचे टिपण किंवा माहिती द्या."),
  headline: z.string().optional(),
  currentBody: z.string().optional(),
  location: z.string().optional(),
  language: z.enum(["marathi", "hindi", "english"]).default("marathi"),
  action: AIActionTypeSchema.default("GENERATE_ARTICLE"),
  categoryId: z.string().optional(),
  imageUrl: z.string().optional(),
});

export type AIStudioInput = z.infer<typeof AIStudioInputSchema>;

