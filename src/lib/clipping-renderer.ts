import sharp from "sharp";
import fs from "fs";
import path from "path";
import prisma from "./prisma";

export type ClippingFormat =
  | "EPAPER"
  | "STORY_1080X1920"
  | "PORTRAIT_1080X1350"
  | "SQUARE_1080X1080"
  | "FACEBOOK"
  | "WHATSAPP";

export interface FormatConfig {
  width: number;
  height: number;
  label: string;
  columns: number;
  fontSizeHeadline: number;
}

export const CLIPPING_FORMATS: Record<ClippingFormat, FormatConfig> = {
  EPAPER: {
    width: 1200,
    height: 1600,
    label: "ई-पेपर आवृत्ती (E-Paper)",
    columns: 2,
    fontSizeHeadline: 42,
  },
  STORY_1080X1920: {
    width: 1080,
    height: 1920,
    label: "इन्स्टाग्राम स्टोरी (1080×1920)",
    columns: 1,
    fontSizeHeadline: 40,
  },
  PORTRAIT_1080X1350: {
    width: 1080,
    height: 1350,
    label: "इन्स्टाग्राम पोस्ट (1080×1350)",
    columns: 1,
    fontSizeHeadline: 36,
  },
  SQUARE_1080X1080: {
    width: 1080,
    height: 1080,
    label: "स्क्वेअर पोस्ट (1080×1080)",
    columns: 1,
    fontSizeHeadline: 34,
  },
  FACEBOOK: {
    width: 1200,
    height: 630,
    label: "फेसबुक शेअर (1200×630)",
    columns: 2,
    fontSizeHeadline: 34,
  },
  WHATSAPP: {
    width: 1200,
    height: 630,
    label: "व्हॉट्सॲप कार्ड (1200×630)",
    columns: 2,
    fontSizeHeadline: 34,
  },
};

export interface ClippingData {
  headline: string;
  subheadline?: string | null;
  summary?: string | null;
  bodyText: string;
  reporterName: string;
  reporterDesignation?: string | null;
  dateStr: string;
  imageUrl?: string | null;
  categoryName: string;
  locationName: string;
  articleUrl: string;
}

export function generateClippingSVG(data: ClippingData, format: ClippingFormat): string {
  const conf = CLIPPING_FORMATS[format] || CLIPPING_FORMATS.EPAPER;
  const { width, height, fontSizeHeadline } = conf;

  // Escape XML
  const cleanHeadline = (data.headline || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const cleanSubheadline = (data.subheadline || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const cleanSummary = (data.summary || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const cleanReporter = (data.reporterName || "विशेष प्रतिनिधी").replace(/&/g, "&amp;");
  const cleanCategory = (data.categoryName || "स्थानिक घडामोडी").replace(/&/g, "&amp;");
  const cleanLocation = (data.locationName || "जामखेड").replace(/&/g, "&amp;");

  // Format date
  const cleanDate = data.dateStr || "१८ सप्टेंबर २०२६";

  return `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Rozha+One&amp;family=Noto+Sans+Devanagari:wght@400;600;700;800&amp;display=swap');
        .masthead { font-family: 'Rozha One', 'Noto Sans Devanagari', serif; font-size: 56px; font-weight: 800; fill: #991B1B; }
        .tagline { font-family: 'Noto Sans Devanagari', sans-serif; font-size: 16px; fill: #4B5563; }
        .dateline { font-family: 'Noto Sans Devanagari', sans-serif; font-size: 15px; fill: #111827; font-weight: 600; }
        .headline { font-family: 'Noto Sans Devanagari', sans-serif; font-size: ${fontSizeHeadline}px; font-weight: 800; fill: #111827; line-height: 1.25; }
        .subhead { font-family: 'Noto Sans Devanagari', sans-serif; font-size: 20px; font-weight: 600; fill: #991B1B; }
        .byline { font-family: 'Noto Sans Devanagari', sans-serif; font-size: 16px; font-weight: 700; fill: #1F2937; }
        .body-text { font-family: 'Noto Sans Devanagari', sans-serif; font-size: 17px; fill: #1F2937; line-height: 1.6; }
        .badge { font-family: 'Noto Sans Devanagari', sans-serif; font-size: 13px; font-weight: 700; fill: #FFFFFF; }
        .footer-text { font-family: 'Noto Sans Devanagari', sans-serif; font-size: 15px; font-weight: 600; fill: #FFFFFF; }
      </style>
    </defs>

    <!-- Newsprint Background -->
    <rect width="${width}" height="${height}" fill="#FAFAF8" />
    <rect x="20" y="20" width="${width - 40}" height="${height - 40}" fill="none" stroke="#D1D5DB" stroke-width="2" />
    <rect x="25" y="25" width="${width - 50}" height="${height - 50}" fill="none" stroke="#111827" stroke-width="1" />

    <!-- Newspaper Header Band -->
    <rect x="40" y="40" width="${width - 80}" height="100" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1" />
    
    <!-- Masthead Logo -->
    <text x="${width / 2}" y="105" text-anchor="middle" class="masthead">आवाज जामखेडचा</text>
    <text x="${width / 2}" y="130" text-anchor="middle" class="tagline">जामखेड आणि अहिल्यानगर परिसराचा बुलंद आवाज • सत्यशोधक डिजिटल वृत्तपत्र</text>

    <!-- Header Divider Lines -->
    <line x1="40" y1="145" x2="${width - 40}" y2="145" stroke="#991B1B" stroke-width="4" />
    <line x1="40" y1="150" x2="${width - 40}" y2="150" stroke="#111827" stroke-width="1" />

    <!-- Dateline Bar -->
    <rect x="40" y="153" width="${width - 80}" height="32" fill="#F3F4F6" />
    <text x="55" y="174" class="dateline">दिनांक: ${cleanDate} | जामखेड आवृत्ती</text>
    <text x="${width - 55}" y="174" text-anchor="end" class="dateline">वेबसाइट: awaazjamkhed.com</text>

    <!-- Category & Location Badge -->
    <rect x="45" y="205" width="130" height="26" rx="4" fill="#991B1B" />
    <text x="110" y="222" text-anchor="middle" class="badge">${cleanCategory}</text>

    <rect x="185" y="205" width="130" height="26" rx="4" fill="#1F2937" />
    <text x="250" y="222" text-anchor="middle" class="badge">📍 ${cleanLocation}</text>

    <!-- Headline (ForeignObject for automatic Devanagari multiline wrapping) -->
    <foreignObject x="45" y="240" width="${width - 90}" height="140">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Noto Sans Devanagari', sans-serif; font-size: ${fontSizeHeadline}px; font-weight: 800; color: #111827; line-height: 1.25;">
        ${cleanHeadline}
      </div>
    </foreignObject>

    <!-- Subheadline if present -->
    ${
      cleanSubheadline
        ? `
    <foreignObject x="45" y="380" width="${width - 90}" height="60">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Noto Sans Devanagari', sans-serif; font-size: 19px; font-weight: 600; color: #991B1B; line-height: 1.3;">
        ${cleanSubheadline}
      </div>
    </foreignObject>`
        : ""
    }

    <!-- Reporter Byline -->
    <line x1="45" y1="435" x2="${width - 45}" y2="435" stroke="#E5E7EB" stroke-width="1.5" />
    <text x="45" y="460" class="byline">विशेष वार्ता: ${cleanReporter} | आवाज जामखेडचा डिजिटल डेस्क</text>
    <line x1="45" y1="475" x2="${width - 45}" y2="475" stroke="#E5E7EB" stroke-width="1.5" />

    <!-- Article Content Box -->
    <foreignObject x="45" y="490" width="${width - 90}" height="${height - 590}">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Noto Sans Devanagari', sans-serif; font-size: 17px; color: #1F2937; line-height: 1.65; text-align: justify; columns: ${conf.columns}; column-gap: 30px; column-rule: 1px solid #E5E7EB;">
        <p style="margin-top: 0; margin-bottom: 12px; font-weight: 600; color: #111827;">
          <strong>${cleanLocation} (आवाज जामखेडचा):</strong> ${cleanSummary}
        </p>
        <p style="margin-bottom: 12px;">
          ${data.bodyText.replace(/[#*`>]/g, "").slice(0, height > 1200 ? 1200 : 500)}
        </p>
      </div>
    </foreignObject>

    <!-- Newspaper Footer Branding Bar -->
    <rect x="25" y="${height - 65}" width="${width - 50}" height="40" fill="#991B1B" />
    <text x="45" y="${height - 40}" class="footer-text">आवाज जामखेडचा — विश्वसनीय स्थानिक पत्रकारिता</text>
    <text x="${width - 45}" y="${height - 40}" text-anchor="end" class="footer-text">अधिकृत संकेतस्थळ: https://awaazjamkhed.com</text>
  </svg>
  `;
}

export async function generateClippingImage(params: {
  articleId: string;
  format: ClippingFormat;
  exportFormat?: "png" | "webp";
}): Promise<{ relativeUrl: string; fullPath: string }> {
  const { articleId, format, exportFormat = "png" } = params;

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      category: true,
      location: true,
      reporter: true,
    },
  });

  if (!article) {
    throw new Error("बातमी अस्तित्वात नाही.");
  }

  const dateFormatted = article.publishedAt
    ? new Intl.DateTimeFormat("mr-IN", { dateStyle: "long" }).format(article.publishedAt)
    : "१८ सप्टेंबर २०२६";

  const clippingData: ClippingData = {
    headline: article.headline,
    subheadline: article.subheadline,
    summary: article.summary,
    bodyText: article.bodyMarkdown,
    reporterName: article.reporter?.nameMarathi || "विशेष प्रतिनिधी",
    reporterDesignation: article.reporter?.designation,
    dateStr: dateFormatted,
    imageUrl: article.featuredImage,
    categoryName: article.category?.nameMarathi || "बातम्या",
    locationName: article.location?.village || "जामखेड",
    articleUrl: `https://awaazjamkhed.com/news/${article.slug}`,
  };

  const svgContent = generateClippingSVG(clippingData, format);

  // Ensure public/clippings directory exists
  const outputDir = path.join(process.cwd(), "public", "clippings");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const fileName = `clipping-${article.slug}-${format.toLowerCase()}-${Date.now()}.${exportFormat}`;
  const fullPath = path.join(outputDir, fileName);
  const relativeUrl = `/clippings/${fileName}`;

  // Render using sharp
  const conf = CLIPPING_FORMATS[format] || CLIPPING_FORMATS.EPAPER;
  const svgBuffer = Buffer.from(svgContent);

  if (exportFormat === "webp") {
    await sharp(svgBuffer, { density: 150 })
      .resize(conf.width, conf.height)
      .webp({ quality: 90 })
      .toFile(fullPath);
  } else {
    await sharp(svgBuffer, { density: 150 })
      .resize(conf.width, conf.height)
      .png({ quality: 90 })
      .toFile(fullPath);
  }

  // Record in database
  await prisma.clipping.create({
    data: {
      articleId,
      format,
      imageUrl: relativeUrl,
      downloadCount: 0,
    },
  });

  return { relativeUrl, fullPath };
}

