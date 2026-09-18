import { describe, it, expect } from "vitest";
import {
  generateClippingSVG,
  CLIPPING_FORMATS,
  ClippingData,
} from "../src/lib/clipping-renderer";

describe("Newspaper Clipping Generator (SVG/Layout Multi-Format)", () => {
  const sampleData: ClippingData = {
    headline: "जामखेड शहराच्या पाणीपुरवठ्यासाठी नवीन जलवाहिनीचे काम सुरू",
    subheadline: "पुढील १५ दिवसांत पाणीपुरवठा सुरळीत होणार",
    summary: "जामखेड नगर परिषदेने सुरू केलेल्या नवीन पाणीपुरवठा योजनेचे काम अंतिम टप्प्यात.",
    bodyText: "जामखेड शहर आणि लगतच्या उपनगरांमधील पिण्याच्या पाण्याचा प्रश्न कायमस्वरूपी निकाली काढण्यासाठी काम वेगाने सुरू आहे.",
    reporterName: "सचिन वारे",
    reporterDesignation: "तालुका प्रतिनिधी",
    dateStr: "१८ सप्टेंबर २०२६",
    categoryName: "स्थानिक घडामोडी",
    locationName: "जामखेड शहर",
    articleUrl: "https://awaazjamkhed.com/news/jamkhed-water-update",
  };

  it("verifies all 6 formats have defined dimensions", () => {
    expect(CLIPPING_FORMATS.EPAPER).toBeDefined();
    expect(CLIPPING_FORMATS.EPAPER.width).toBe(1200);
    expect(CLIPPING_FORMATS.EPAPER.height).toBe(1600);

    expect(CLIPPING_FORMATS.STORY_1080X1920.width).toBe(1080);
    expect(CLIPPING_FORMATS.STORY_1080X1920.height).toBe(1920);

    expect(CLIPPING_FORMATS.PORTRAIT_1080X1350.width).toBe(1080);
    expect(CLIPPING_FORMATS.PORTRAIT_1080X1350.height).toBe(1350);

    expect(CLIPPING_FORMATS.SQUARE_1080X1080.width).toBe(1080);
    expect(CLIPPING_FORMATS.SQUARE_1080X1080.height).toBe(1080);

    expect(CLIPPING_FORMATS.FACEBOOK.width).toBe(1200);
    expect(CLIPPING_FORMATS.WHATSAPP.width).toBe(1200);
  });

  it("generates an E-Paper SVG containing brand logo, headline, and byline", () => {
    const svg = generateClippingSVG(sampleData, "EPAPER");

    expect(svg).toContain("<svg");
    expect(svg).toContain("आवाज जामखेडचा");
    expect(svg).toContain("जामखेड शहराच्या पाणीपुरवठ्यासाठी नवीन जलवाहिनीचे काम सुरू");
    expect(svg).toContain("सचिन वारे");
    expect(svg).toContain("awaazjamkhed.com");
  });

  it("generates an Instagram Story SVG with 1080x1920 viewBox", () => {
    const svg = generateClippingSVG(sampleData, "STORY_1080X1920");

    expect(svg).toContain('width="1080"');
    expect(svg).toContain('height="1920"');
    expect(svg).toContain("आवाज जामखेडचा");
  });
});

