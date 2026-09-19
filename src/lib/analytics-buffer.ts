import prisma, { isDatabaseAvailable } from "./prisma";
import crypto from "crypto";

interface ViewEvent {
  articleId: string;
  visitorHash: string;
  referrer?: string | null;
  device?: string | null;
  durationSeconds?: number;
  timestamp: number;
}

// In-memory aggregation buffer to prevent database locking on high traffic
class AnalyticsBuffer {
  private buffer: ViewEvent[] = [];
  private visitedKeys = new Set<string>();
  private flushIntervalMs = 15000; // 15 seconds
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    this.startFlushTimer();
  }

  private startFlushTimer() {
    // Avoid unfreeze background intervals on serverless platforms (Vercel)
    const isServerless = process.env.VERCEL === "1" || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
    if (typeof window === "undefined" && !isServerless) {
      this.timer = setInterval(() => {
        this.flush();
      }, this.flushIntervalMs);
    }
  }

  // Detect bots via user agent
  public isBot(userAgent?: string | null): boolean {
    if (!userAgent) return true;
    const botPattern = /bot|crawl|spider|slurp|facebookexternalhit|bingbot|googlebot|yandex|duckduckbot/i;
    return botPattern.test(userAgent);
  }

  // Anonymized visitor hash (privacy-conscious)
  public generateVisitorHash(ip: string, userAgent: string): string {
    const salt = "awaaz_privacy_salt_2026";
    return crypto.createHash("sha256").update(`${ip}-${userAgent}-${salt}`).digest("hex").slice(0, 16);
  }

  public recordView(event: Omit<ViewEvent, "timestamp">) {
    const key = `${event.articleId}:${event.visitorHash}`;
    const now = Date.now();

    // Deduplicate same visitor viewing same article within 10 minutes
    if (this.visitedKeys.has(key)) {
      return;
    }

    this.visitedKeys.add(key);
    setTimeout(() => {
      this.visitedKeys.delete(key);
    }, 10 * 60 * 1000);

    this.buffer.push({
      ...event,
      timestamp: now,
    });

    // If buffer exceeds 50 items, trigger immediate flush
    if (this.buffer.length >= 50) {
      this.flush();
    }
  }

  public async flush() {
    if (this.buffer.length === 0) return;

    const isReady = await isDatabaseAvailable();
    if (!isReady) {
      // Clear buffer safely to prevent memory build-up when offline
      this.buffer = [];
      return;
    }

    const eventsToFlush = [...this.buffer];
    this.buffer = [];

    // Group views by articleId
    const countsByArticle: Record<string, { total: number; uniqueVisitors: Set<string> }> = {};

    for (const ev of eventsToFlush) {
      if (!countsByArticle[ev.articleId]) {
        countsByArticle[ev.articleId] = { total: 0, uniqueVisitors: new Set() };
      }
      countsByArticle[ev.articleId].total += 1;
      countsByArticle[ev.articleId].uniqueVisitors.add(ev.visitorHash);
    }

    try {
      // Batch record in ArticleView table
      for (const ev of eventsToFlush) {
        await prisma.articleView.create({
          data: {
            articleId: ev.articleId,
            visitorHash: ev.visitorHash,
            referrer: ev.referrer || null,
            device: ev.device || "DESKTOP",
            durationSeconds: ev.durationSeconds || 0,
          },
        }).catch(() => {});
      }

      // Increment article counters
      for (const [artId, stats] of Object.entries(countsByArticle)) {
        await prisma.article.update({
          where: { id: artId },
          data: {
            viewCount: { increment: stats.total },
            uniqueVisitors: { increment: stats.uniqueVisitors.size },
          },
        }).catch(() => {});
      }
    } catch (err) {
      console.error("Error flushing analytics buffer:", err);
    }
  }
}

// Global singleton for Next.js
declare global {
  // eslint-disable-next-line no-var
  var analyticsBufferGlobal: AnalyticsBuffer | undefined;
}

export const analyticsBuffer = global.analyticsBufferGlobal || new AnalyticsBuffer();
if (process.env.NODE_ENV !== "production") {
  global.analyticsBufferGlobal = analyticsBuffer;
}

export default analyticsBuffer;

