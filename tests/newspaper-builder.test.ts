import { describe, it, expect } from "vitest";
import { NEWSPAPER_TEMPLATES, createPageFromTemplate } from "../src/lib/newspaper/templates";
import { PAGE_DIMENSIONS, NewspaperTemplateId, ArticleSummaryItem, NewspaperEdition } from "../src/types/newspaper";
import { MARATHI_FONTS, getFontStyles } from "../src/lib/newspaper/fonts";
import { generateDeterministicNewspaperLayout } from "../src/lib/newspaper/ai-layout";
import { validateNewspaperEdition } from "../src/lib/newspaper/exporter";

describe("Modular Newspaper & E-Paper Builder Suite", () => {
  const mockArticles: ArticleSummaryItem[] = [
    {
      id: "art_1",
      headline: "जामखेड कृषी उत्पन्न बाजार समितीत हरभऱ्याची विक्रमी आवक",
      subheadline: "शेतकऱ्यांना हमीभावापेक्षा जास्त दर मिळाल्याने समाधान",
      summary: "जामखेड बाजार समितीत आज हरभऱ्याची विक्रमी आवक झाली असून भावात सुधारणा झाली आहे.",
      bodyMarkdown: "जामखेड बाजार समितीत हरभऱ्याला चांगला भाव मिळाला. तालुक्यातील शेतकऱ्यांनी मोठ्या प्रमाणात माल आणला होता. व्यापारी वर्गाकडूनही उत्साह दिसून आला.",
      featuredImage: "https://example.com/chana.jpg",
      categoryName: "शेती व बाजारभाव",
      locationName: "जामखेड",
      publishedAt: new Date().toISOString(),
      reporterName: "कृषी प्रतिनिधी",
    },
    {
      id: "art_2",
      headline: "खर्डा येथे ऐतिहासिक किल्ल्याच्या संवर्धनासाठी ग्रामस्थांचे श्रमदान",
      summary: "खर्डा किल्ल्याच्या संवर्धनासाठी युवकांनी पुढाकार घेतला.",
      bodyMarkdown: "खर्डा येथील शिवप्रेमी युवकांनी एकत्र येऊन ऐतिहासिक किल्ल्याची स्वच्छता केली.",
      categoryName: "स्थानिक घडामोडी",
      locationName: "खर्डा",
      publishedAt: new Date().toISOString(),
    },
  ];

  describe("1. Template Registry & Page Sizes", () => {
    it("provides all 8 required newspaper templates", () => {
      const requiredTemplates: NewspaperTemplateId[] = [
        "classic-2-col",
        "classic-3-col",
        "hero-news",
        "local-press",
        "photo-feature",
        "breaking-news",
        "multi-story",
        "editorial-feature",
      ];

      requiredTemplates.forEach((tId) => {
        expect(NEWSPAPER_TEMPLATES[tId]).toBeDefined();
        expect(NEWSPAPER_TEMPLATES[tId].nameMarathi).toBeTruthy();
        expect(NEWSPAPER_TEMPLATES[tId].description).toBeTruthy();
      });
    });

    it("defines proper dimensions for A4 and Newspaper Broadside sizes", () => {
      expect(PAGE_DIMENSIONS.A4_PORTRAIT.width).toBe(820);
      expect(PAGE_DIMENSIONS.A4_PORTRAIT.height).toBe(1160);
      expect(PAGE_DIMENSIONS.A4_LANDSCAPE.width).toBe(1160);
      expect(PAGE_DIMENSIONS.NEWSPAPER_PORTRAIT.width).toBe(900);
    });
  });

  describe("2. Page Factory & Module Generation", () => {
    it("generates page 1 with masthead, dateline, and structured content modules", () => {
      const page = createPageFromTemplate("hero-news", 1, mockArticles);

      expect(page.pageNumber).toBe(1);
      expect(page.templateId).toBe("hero-news");
      expect(page.modules.length).toBeGreaterThan(3);

      const masthead = page.modules.find((m) => m.type === "masthead");
      expect(masthead).toBeDefined();
      expect(masthead?.title).toBe("आवाज जामखेडचा");

      const headline = page.modules.find((m) => m.type === "headline");
      expect(headline).toBeDefined();
      expect(headline?.title).toBe(mockArticles[0].headline);

      const heroImg = page.modules.find((m) => m.type === "hero-image");
      expect(heroImg).toBeDefined();
      expect(heroImg?.image?.url).toBe(mockArticles[0].featuredImage);

      const footer = page.modules.find((m) => m.type === "footer");
      expect(footer).toBeDefined();
    });

    it("omits masthead on subsequent pages while maintaining dateline and page number", () => {
      const page2 = createPageFromTemplate("classic-2-col", 2, mockArticles);

      expect(page2.pageNumber).toBe(2);
      const masthead = page2.modules.find((m) => m.type === "masthead");
      expect(masthead).toBeUndefined();

      const dateline = page2.modules.find((m) => m.type === "dateline");
      expect(dateline).toBeDefined();

      expect(page2.footerConfig.pageNumberText).toBe("पान २");
    });
  });

  describe("3. Typography & Font System", () => {
    it("supports traditional Tiro Devanagari Marathi press headline font", () => {
      const tiro = MARATHI_FONTS["tiro-press"];
      expect(tiro).toBeDefined();
      expect(tiro.nameEnglish).toContain("Tiro Devanagari Marathi — Press");
      expect(tiro.cssFamily).toContain("Tiro Devanagari Marathi");

      const styles = getFontStyles("tiro-press", "display", undefined, "left", "black");
      expect(styles.fontFamily).toContain("Tiro Devanagari Marathi");
      expect(styles.fontSize).toBe("36px");
      expect(styles.textAlign).toBe("left");
    });

    it("supports Mukta and Noto Serif for subhead and body typography", () => {
      expect(MARATHI_FONTS["mukta"]).toBeDefined();
      expect(MARATHI_FONTS["noto-serif"]).toBeDefined();
      expect(MARATHI_FONTS["noto-sans"]).toBeDefined();
    });
  });

  describe("4. AI Layout Suggestion & Fallback Planner", () => {
    it("deterministically creates an intelligent layout hierarchy from provided articles", () => {
      const plan = generateDeterministicNewspaperLayout(mockArticles);

      expect(plan.template).toBeDefined();
      expect(plan.leadArticleId).toBe("art_1");
      expect(plan.storyHierarchy.length).toBe(2);
      expect(plan.storyHierarchy[0].priority).toBe("LEAD");
      expect(plan.storyHierarchy[0].recommendedColumns).toBe(3);
      expect(plan.storyHierarchy[1].priority).toBe("SECONDARY");
      expect(plan.reasoning).toBeTruthy();
    });
  });

  describe("5. Validation & Export Safety", () => {
    it("validates edition structure and warns on empty or invalid modules", () => {
      const invalidEdition: NewspaperEdition = {
        id: "test_edition",
        title: "Test",
        editionDate: "2026-09-21",
        issueNumber: "1",
        district: "जामखेड",
        status: "DRAFT",
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pages: [
          {
            id: "page_1",
            pageNumber: 1,
            pageSize: "A4_PORTRAIT",
            templateId: "hero-news",
            headerConfig: {
              showMasthead: true,
              publicationName: "आवाज जामखेडचा",
              tagline: "",
              editionName: "",
              dateStr: "",
              districtStr: "",
              issueNumber: "",
              websiteUrl: "",
            },
            footerConfig: { publicationName: "", websiteUrl: "", pageNumberText: "", disclaimer: "" },
            modules: [
              {
                id: "empty_img",
                type: "hero-image",
                order: 1,
                image: { url: "" },
              },
            ],
          },
        ],
      };

      const warnings = validateNewspaperEdition(invalidEdition);
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some((w) => w.message.includes("प्रतिमा जोडलेली नाही"))).toBe(true);
    });
  });
});

