import { describe, it, expect } from "vitest";
import { calculateTrendingScore, TrendingWeights } from "../src/lib/trending";

describe("Trending Engine Scoring Algorithm", () => {
  const defaultWeights: TrendingWeights = {
    weightViews24h: 0.5,
    weightShares: 1.5,
    weightRecency: 0.3,
  };

  it("assigns higher score to an article with higher view counts", () => {
    const artA = { viewCount: 2000, publishedAt: new Date(), priority: 0 };
    const artB = { viewCount: 500, publishedAt: new Date(), priority: 0 };

    const scoreA = calculateTrendingScore(artA, defaultWeights);
    const scoreB = calculateTrendingScore(artB, defaultWeights);

    expect(scoreA).toBeGreaterThan(scoreB);
  });

  it("gives an editorial priority boost", () => {
    const normalArticle = { viewCount: 1000, publishedAt: new Date(), priority: 0 };
    const highPriorityArticle = { viewCount: 1000, publishedAt: new Date(), priority: 3 };

    const scoreNormal = calculateTrendingScore(normalArticle, defaultWeights);
    const scorePriority = calculateTrendingScore(highPriorityArticle, defaultWeights);

    expect(scorePriority).toBeGreaterThan(scoreNormal);
  });

  it("applies recency decay for older articles", () => {
    const freshArticle = { viewCount: 1000, publishedAt: new Date(), priority: 0 };
    const oldArticle = {
      viewCount: 1000,
      publishedAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48 hours ago
      priority: 0,
    };

    const scoreFresh = calculateTrendingScore(freshArticle, defaultWeights);
    const scoreOld = calculateTrendingScore(oldArticle, defaultWeights);

    expect(scoreFresh).toBeGreaterThan(scoreOld);
  });
});

