import { describe, it, expect } from "vitest";
import { ArticleFormSchema } from "../src/schemas/article.schema";

describe("Admin News Form Validation (ArticleFormSchema)", () => {
  const validBaseArticle = {
    headline: "जामखेड शहरात नवीन जलवाहिनी कामाचा शुभारंभ",
    subheadline: "खर्डा चौक ते बीड नाका परिसरातील नागरिकांना दिलासा",
    summary: "जामखेड शहराच्या पाणीपुरवठा सुधारणेसाठी नवीन जलवाहिनीचे काम सुरू झाले आहे.",
    bodyMarkdown: "जामखेड (विशेष बातमीदार): जामखेड नगरपरिषद हद्दीतील बहुप्रतिक्षित पाणीपुरवठा योजनेचे काम आजपासून सुरू झाले.",
    categoryId: "cat-jamkhed-special",
    featuredImage: "/uploads/media/2026/09/awaaz-fe89ab12c34d.webp",
  };

  it("validates a complete article with local optimized WebP image and valid category", () => {
    const result = ArticleFormSchema.safeParse(validBaseArticle);
    expect(result.success).toBe(true);
  });

  it("validates an article with external HTTPS image URL", () => {
    const result = ArticleFormSchema.safeParse({
      ...validBaseArticle,
      featuredImage: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167",
    });
    expect(result.success).toBe(true);
  });

  it("allows empty or omitted featuredImage (featured image is optional)", () => {
    const withoutImage = { ...validBaseArticle, featuredImage: "" };
    const result1 = ArticleFormSchema.safeParse(withoutImage);
    expect(result1.success).toBe(true);

    const nullImage = { ...validBaseArticle, featuredImage: null };
    const result2 = ArticleFormSchema.safeParse(nullImage);
    expect(result2.success).toBe(true);
  });

  it("REJECTS article when Category is missing or empty string", () => {
    const missingCategory = { ...validBaseArticle, categoryId: "" };
    const result = ArticleFormSchema.safeParse(missingCategory);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("विभाग (Category) निवडा");
    }
  });

  it("REJECTS article when Headline is too short", () => {
    const shortHeadline = { ...validBaseArticle, headline: "बात" };
    const result = ArticleFormSchema.safeParse(shortHeadline);
    expect(result.success).toBe(false);
  });

  it("REJECTS article when Body Content is missing or too short", () => {
    const shortBody = { ...validBaseArticle, bodyMarkdown: "कमी मजकूर" };
    const result = ArticleFormSchema.safeParse(shortBody);
    expect(result.success).toBe(false);
  });
});
