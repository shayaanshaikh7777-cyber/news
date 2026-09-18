import prisma from "./prisma";

export type AdPlacement =
  | "HEADER"
  | "TOP_BANNER"
  | "SIDEBAR"
  | "ARTICLE_TOP"
  | "ARTICLE_MIDDLE"
  | "ARTICLE_BOTTOM"
  | "FOOTER"
  | "MOBILE_STICKY";

export interface GetAdOptions {
  placement: AdPlacement;
  device?: string; // ALL, MOBILE, DESKTOP
  category?: string;
  location?: string;
}

export async function getActiveAdForPlacement(options: GetAdOptions) {
  const { placement, device = "ALL", category, location } = options;
  const now = new Date();

  // Query eligible ads
  const ads = await prisma.advertisement.findMany({
    where: {
      placement,
      isActive: true,
      OR: [{ startDate: null }, { startDate: { lte: now } }],
      AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
    },
  });

  if (ads.length === 0) {
    return null;
  }

  // Filter device if specified
  const filteredAds = ads.filter((ad) => {
    if (ad.device && ad.device !== "ALL" && device !== "ALL") {
      return ad.device === device;
    }
    return true;
  });

  if (filteredAds.length === 0) {
    return ads[0]; // fallback
  }

  // Weighted probabilistic selection
  const totalWeight = filteredAds.reduce((sum, ad) => sum + Math.max(1, ad.weight), 0);
  let random = Math.random() * totalWeight;

  for (const ad of filteredAds) {
    random -= Math.max(1, ad.weight);
    if (random <= 0) {
      return ad;
    }
  }

  return filteredAds[0];
}

export async function recordAdImpression(adId: string, visitorHash: string) {
  try {
    await prisma.advertisement.update({
      where: { id: adId },
      data: { impressions: { increment: 1 } },
    });

    await prisma.adImpression.create({
      data: {
        adId,
        visitorHash,
      },
    });
  } catch (err) {
    console.error("Ad impression record error:", err);
  }
}

export async function recordAdClick(adId: string, visitorHash: string) {
  try {
    await prisma.advertisement.update({
      where: { id: adId },
      data: { clicks: { increment: 1 } },
    });

    await prisma.adClick.create({
      data: {
        adId,
        visitorHash,
      },
    });
  } catch (err) {
    console.error("Ad click record error:", err);
  }
}

