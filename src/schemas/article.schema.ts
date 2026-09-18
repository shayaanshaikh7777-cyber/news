import { z } from "zod";

export const ArticleFormSchema = z.object({
  headline: z.string().min(5, "शीर्षक आवश्यक आहे"),
  subheadline: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  bodyMarkdown: z.string().min(10, "बातमीचा मजकूर आवश्यक आहे"),
  featuredImage: z.string().url("वैध इमेज URL द्या").optional().nullable().or(z.literal("")),
  gallery: z.string().optional().nullable(), // JSON string
  youtubeUrl: z
    .string()
    .optional()
    .nullable()
    .or(z.literal(""))
    .refine(
      (val) => {
        if (!val) return true;
        return (
          val.includes("youtube.com/watch") ||
          val.includes("youtu.be/") ||
          val.includes("youtube.com/embed/") ||
          val.includes("youtube.com/shorts/")
        );
      },
      { message: "कृपया वैध YouTube लिंक प्रविष्ट करा" }
    ),
  categoryId: z.string().min(1, "वर्ग निवडणे आवश्यक आहे"),
  locationId: z.string().optional().nullable(),
  reporterId: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  priority: z.coerce.number().default(0),
  isBreaking: z.boolean().default(false),
  status: z.string().default("DRAFT"),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  seoKeywords: z.string().optional().nullable(),
  slug: z.string().optional().nullable(),
});

export type ArticleFormData = z.infer<typeof ArticleFormSchema>;

export const LiveUpdateFormSchema = z.object({
  articleId: z.string().min(1),
  content: z.string().min(3, "लाईव्ह अपडेट मजकूर आवश्यक आहे"),
  authorName: z.string().min(2, "नाव आवश्यक आहे"),
});

export const BreakingNewsFormSchema = z.object({
  title: z.string().min(5, "ब्रेकिंग न्यूज शीर्षक आवश्यक आहे"),
  linkUrl: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  priority: z.coerce.number().default(1),
  isActive: z.boolean().default(true),
  expiresHours: z.coerce.number().default(24),
});

