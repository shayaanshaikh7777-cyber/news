export type PageSize =
  | "A4_PORTRAIT"
  | "A4_LANDSCAPE"
  | "NEWSPAPER_PORTRAIT"
  | "LETTER_PORTRAIT";

export interface PageDimension {
  width: number; // in pixels at standard canvas resolution (e.g. 794 for A4)
  height: number; // in pixels (e.g. 1123 for A4)
  label: string;
  aspectRatio: string; // e.g. "1:1.414"
  mmWidth: number;
  mmHeight: number;
}

export const PAGE_DIMENSIONS: Record<PageSize, PageDimension> = {
  A4_PORTRAIT: {
    width: 820,
    height: 1160,
    label: "A4 पोर्ट्रेट (A4 Portrait)",
    aspectRatio: "1:1.414",
    mmWidth: 210,
    mmHeight: 297,
  },
  A4_LANDSCAPE: {
    width: 1160,
    height: 820,
    label: "A4 लँडस्केप (A4 Landscape)",
    aspectRatio: "1.414:1",
    mmWidth: 297,
    mmHeight: 210,
  },
  NEWSPAPER_PORTRAIT: {
    width: 900,
    height: 1280,
    label: "वृत्तपत्र ब्रॉडशीट (Newspaper Tabloid)",
    aspectRatio: "1:1.422",
    mmWidth: 280,
    mmHeight: 398,
  },
  LETTER_PORTRAIT: {
    width: 816,
    height: 1056,
    label: "लेटर पोर्ट्रेट (Letter Portrait)",
    aspectRatio: "1:1.294",
    mmWidth: 216,
    mmHeight: 279,
  },
};

export type NewspaperTemplateId =
  | "classic-2-col"
  | "classic-3-col"
  | "hero-news"
  | "local-press"
  | "photo-feature"
  | "breaking-news"
  | "multi-story"
  | "editorial-feature";

export interface TemplateDefinition {
  id: NewspaperTemplateId;
  nameMarathi: string;
  nameEnglish: string;
  description: string;
  recommendedStoryCount: number;
  defaultPageSize: PageSize;
  badge: string;
}

export type ModuleType =
  // Text Modules
  | "headline"
  | "subheadline"
  | "section-label"
  | "body-columns"
  | "small-story"
  | "side-story"
  | "reporter-byline"
  | "location-tag"
  // Image Modules
  | "single-image"
  | "hero-image"
  | "image-caption"
  | "image-grid-2"
  | "image-grid-3"
  | "image-grid-4"
  // Editorial Modules
  | "quote-box"
  | "highlight-box"
  | "fact-box"
  | "bullet-box"
  | "timeline"
  | "breaking-strip"
  | "info-card"
  // Newspaper System Modules
  | "masthead"
  | "dateline"
  | "page-number"
  | "footer"
  | "reporter-credit";

export type MarathiFontFamily =
  | "tiro-press"
  | "mukta"
  | "noto-serif"
  | "noto-sans";

export type PresetFontSize =
  | "display" // 32-40px
  | "xl" // 24-28px
  | "large" // 18-22px
  | "normal" // 14-16px
  | "small" // 11-13px
  | "fine"; // 9-10px

export type TextAlignment = "left" | "center" | "right" | "justify";

export interface ModuleStyleConfig {
  fontFamily?: MarathiFontFamily;
  fontSize?: PresetFontSize;
  customFontSizePx?: number;
  fontWeight?: "normal" | "medium" | "bold" | "black";
  alignment?: TextAlignment;
  colorHex?: string;
  backgroundColorHex?: string;
  borderColorHex?: string;
  borderWidthPx?: number;
  columnCount?: 1 | 2 | 3 | 4;
  lineHeight?: number;
  marginTop?: number;
  marginBottom?: number;
  padding?: number;
}

export interface ImageModuleData {
  url: string;
  altText?: string;
  caption?: string;
  objectFit?: "cover" | "contain";
  focalPosition?: "center" | "top" | "bottom" | "left" | "right";
  aspectRatio?: string;
  zoom?: number;
}

export interface FactItem {
  label: string;
  value: string;
}

export interface TimelineItem {
  time: string;
  event: string;
}

export interface NewspaperModuleConfig {
  id: string;
  type: ModuleType;
  articleId?: string;
  title?: string;
  subheadline?: string;
  content?: string;
  excerpt?: string;
  quote?: {
    text: string;
    speaker: string;
    designation?: string;
  };
  facts?: FactItem[];
  timeline?: TimelineItem[];
  bullets?: string[];
  image?: ImageModuleData;
  secondaryImages?: ImageModuleData[];
  locationTag?: string;
  categoryName?: string;
  byline?: string;
  order: number;
  colSpan?: number; // 1 to 12
  style?: ModuleStyleConfig;
}

export interface HeaderConfig {
  showMasthead: boolean;
  publicationName: string;
  tagline: string;
  editionName: string;
  dateStr: string;
  districtStr: string;
  issueNumber: string;
  websiteUrl: string;
  logoUrl?: string;
}

export interface FooterConfig {
  publicationName: string;
  websiteUrl: string;
  pageNumberText: string;
  disclaimer: string;
}

export interface NewspaperPage {
  id: string;
  pageNumber: number;
  pageSize: PageSize;
  templateId: NewspaperTemplateId;
  modules: NewspaperModuleConfig[];
  headerConfig: HeaderConfig;
  footerConfig: FooterConfig;
}

export interface NewspaperEdition {
  id: string;
  title: string;
  editionDate: string;
  issueNumber: string;
  district: string;
  pages: NewspaperPage[];
  status: "DRAFT" | "PUBLISHED";
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleSummaryItem {
  id: string;
  headline: string;
  subheadline?: string | null;
  summary?: string | null;
  bodyMarkdown: string;
  featuredImage?: string | null;
  categoryName: string;
  locationName: string;
  publishedAt?: string | null;
  reporterName?: string | null;
}

export interface AILayoutPlan {
  template: NewspaperTemplateId;
  editorialTheme: string;
  leadArticleId?: string;
  leadArticleHeadline?: string;
  storyHierarchy: {
    articleId: string;
    priority: "LEAD" | "SECONDARY" | "SIDEBAR" | "BRIEF";
    recommendedModule: ModuleType;
    recommendedColumns: number;
    recommendedExcerpt?: string;
    keyPoints?: string[];
  }[];
  quoteSuggestion?: {
    text: string;
    speaker: string;
  };
  reasoning: string;
}

