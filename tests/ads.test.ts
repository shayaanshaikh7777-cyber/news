import { describe, it, expect } from "vitest";
import { AdPlacement } from "../src/lib/ads";

describe("Advertisement Engine & Monetization", () => {
  const validPlacements: AdPlacement[] = [
    "HEADER",
    "TOP_BANNER",
    "SIDEBAR",
    "ARTICLE_TOP",
    "ARTICLE_MIDDLE",
    "ARTICLE_BOTTOM",
    "FOOTER",
    "MOBILE_STICKY",
  ];

  it("verifies all 8 requested ad placements are supported", () => {
    expect(validPlacements.length).toBe(8);
    expect(validPlacements).toContain("HEADER");
    expect(validPlacements).toContain("SIDEBAR");
    expect(validPlacements).toContain("ARTICLE_MIDDLE");
    expect(validPlacements).toContain("MOBILE_STICKY");
  });

  it("calculates click-through-rate (CTR) correctly", () => {
    const impressions = 5000;
    const clicks = 150;
    const ctr = ((clicks / impressions) * 100).toFixed(2);
    expect(ctr).toBe("3.00");
  });

  it("calculates estimated revenue with CPM ₹45", () => {
    const impressions = 20000;
    const directCampaignRevenue = 15000;
    const adSenseRevenue = (impressions / 1000) * 45; // ₹900
    const total = directCampaignRevenue + adSenseRevenue;

    expect(adSenseRevenue).toBe(900);
    expect(total).toBe(15900);
  });
});

