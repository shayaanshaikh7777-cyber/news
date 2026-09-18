import prisma from "./prisma";

export interface TrendingWeights {
  weightViews24h: number;
  weightShares: number;
  weightRecency: number;
}

export async function getTrendingWeights(): Promise<TrendingWeights> {
  try {
    const settings = await prisma.siteSetting.findMany({
      where: {
        key: {
          in: ["trending_weight_views_24h", "trending_weight_shares", "trending_weight_recency"],
        },
      },
    });

    const map: Record<string, number> = {};
    settings.forEach((s) => {
      map[s.key] = parseFloat(s.value) || 0;
    });

    return {
      weightViews24h: map["trending_weight_views_24h"] ?? 0.5,
      weightShares: map["trending_weight_shares"] ?? 1.5,
      weightRecency: map["trending_weight_recency"] ?? 0.3,
    };
  } catch {
    return {
      weightViews24h: 0.5,
      weightShares: 1.5,
      weightRecency: 0.3,
    };
  }
}

export function calculateTrendingScore(
  article: {
    viewCount: number;
    publishedAt: Date | null;
    priority?: number;
  },
  weights: TrendingWeights
): number {
  const now = Date.now();
  const publishedTime = article.publishedAt ? new Date(article.publishedAt).getTime() : now;
  const ageInHours = Math.max(1, (now - publishedTime) / (1000 * 60 * 60));

  // Recency factor decays exponentially over 72 hours
  const recencyFactor = Math.max(0, 100 - ageInHours * 1.2);
  const viewsScore = (article.viewCount || 0) * weights.weightViews24h;
  const priorityBoost = (article.priority || 0) * 50;

  return viewsScore + recencyFactor * weights.weightRecency + priorityBoost;
}

export async function getTrendingNews(limit = 5) {
  try {
    const weights = await getTrendingWeights();

    const articles = await prisma.article.findMany({
      where: {
        status: "PUBLISHED",
      },
      include: {
        category: true,
        location: true,
        reporter: true,
      },
      orderBy: { publishedAt: "desc" },
      take: 30,
    });

    const scored = articles.map((art) => ({
      ...art,
      score: calculateTrendingScore(art, weights),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  } catch (err) {
    console.warn("Trending: Database query failed, returning empty list.", err);
    return [];
  }
}

export async function getMostReadToday(limit = 5) {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return await prisma.article.findMany({
      where: {
        status: "PUBLISHED",
        publishedAt: { gte: startOfDay },
      },
      include: { category: true, location: true, reporter: true },
      orderBy: { viewCount: "desc" },
      take: limit,
    });
  } catch (err) {
    console.warn("MostRead: Database query failed, returning empty list.", err);
    return [];
  }
}

export async function getPopularInJamkhed(limit = 5) {
  try {
    return await prisma.article.findMany({
      where: {
        status: "PUBLISHED",
        location: {
          taluka: "जामखेड",
        },
      },
      include: { category: true, location: true, reporter: true },
      orderBy: { viewCount: "desc" },
      take: limit,
    });
  } catch (err) {
    console.warn("PopularInJamkhed: Database query failed, returning empty list.", err);
    return [];
  }
}

