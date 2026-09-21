import {
  ArticleSummaryItem,
  HeaderConfig,
  FooterConfig,
  NewspaperModuleConfig,
  NewspaperPage,
  NewspaperTemplateId,
  TemplateDefinition,
} from "@/types/newspaper";

export const NEWSPAPER_TEMPLATES: Record<NewspaperTemplateId, TemplateDefinition> = {
  "classic-2-col": {
    id: "classic-2-col",
    nameMarathi: "क्लासिक २ कॉलम (Classic 2 Column)",
    nameEnglish: "Classic 2 Column",
    description: "दोन संतुलित स्तंभांमध्ये वृत्त रचना, मुख्य फोटो आणि बाजूला संक्षिप्त बातमी.",
    recommendedStoryCount: 2,
    defaultPageSize: "A4_PORTRAIT",
    badge: "संतुलित वृत्त",
  },
  "classic-3-col": {
    id: "classic-3-col",
    nameMarathi: "क्लासिक ३ कॉलम (Classic 3 Column)",
    nameEnglish: "Classic 3 Column",
    description: "पारंपरिक वर्तमानपत्र लेआउट, ३ स्तंभांचा मजकूर आणि ठळक वृत्त मथळा.",
    recommendedStoryCount: 3,
    defaultPageSize: "A4_PORTRAIT",
    badge: "पारंपरिक ब्रॉडशीट",
  },
  "hero-news": {
    id: "hero-news",
    nameMarathi: "हिरो मुख्य वृत्त (Hero News)",
    nameEnglish: "Hero News",
    description: "मोठा मुख्य फोटो, भव्य मथळा, उपशीर्षक आणि सविस्तर वार्तांकनासाठी डिझाइन.",
    recommendedStoryCount: 2,
    defaultPageSize: "A4_PORTRAIT",
    badge: "मोठी बातमी",
  },
  "local-press": {
    id: "local-press",
    nameMarathi: "स्थानिक वार्तापत्र (Local Press)",
    nameEnglish: "Local Press",
    description: "मुख्य स्थानिक बातमी, २ बाजूच्या संक्षिप्त घडामोडी आणि फॅक्ट बॉक्स.",
    recommendedStoryCount: 4,
    defaultPageSize: "A4_PORTRAIT",
    badge: "तालुका / जिल्हा विशेष",
  },
  "photo-feature": {
    id: "photo-feature",
    nameMarathi: "छायाचित्र विशेष (Photo Feature)",
    nameEnglish: "Photo Feature",
    description: "दृकश्राव्य पत्रकारिता, मुख्य छायाचित्र आणि दुय्यम फोटोंची वृत्त ग्रिड.",
    recommendedStoryCount: 2,
    defaultPageSize: "A4_PORTRAIT",
    badge: "फोटो जर्नलिझम",
  },
  "breaking-news": {
    id: "breaking-news",
    nameMarathi: "तातडीचे वृत्त (Breaking News)",
    nameEnglish: "Breaking News",
    description: "ठळक लाल ब्रेकिंग बॅनर, तात्काळ घडामोडींचा टाइमलाइन बॉक्स आणि मुख्य चित्र.",
    recommendedStoryCount: 2,
    defaultPageSize: "A4_PORTRAIT",
    badge: "ब्रेकिंग न्यूज",
  },
  "multi-story": {
    id: "multi-story",
    nameMarathi: "बहु-वार्ता मुखपृष्ठ (Multi Story)",
    nameEnglish: "Multi Story",
    description: "एकाच पानावर ४-५ महत्त्वाच्या बातम्या, शीर्षके आणि संक्षिप्त सारांश.",
    recommendedStoryCount: 5,
    defaultPageSize: "A4_PORTRAIT",
    badge: "मुखपृष्ठ / फ्रंट पेज",
  },
  "editorial-feature": {
    id: "editorial-feature",
    nameMarathi: "संपादकीय विशेष (Editorial Feature)",
    nameEnglish: "Editorial Feature",
    description: "गंभीर विश्लेषणात्मक लेख, विचारवंतांचे अवतरण बॉक्स आणि बायलाईन.",
    recommendedStoryCount: 2,
    defaultPageSize: "A4_PORTRAIT",
    badge: "संपादकीय / विचार",
  },
};

export function toDevanagariNumeral(num: number): string {
  const devanagariDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
  return String(num)
    .split("")
    .map((d) => (d >= "0" && d <= "9" ? devanagariDigits[parseInt(d, 10)] : d))
    .join("");
}

export const DEFAULT_HEADER_CONFIG: HeaderConfig = {
  showMasthead: true,
  publicationName: "आवाज जामखेडचा",
  tagline: "जामखेड आणि अहिल्यानगर परिसराचा बुलंद आवाज • निर्भीड डिजिटल वृत्तपत्र",
  editionName: "जामखेड दैनिक आवृत्ती",
  dateStr: new Intl.DateTimeFormat("mr-IN", { dateStyle: "long" }).format(new Date()),
  districtStr: "अहिल्यानगर (महाराष्ट्र)",
  issueNumber: `अंक: ${new Date().getFullYear()}/${new Date().getMonth() + 1}`,
  websiteUrl: "https://awaazjamkhed.com",
};

export const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  publicationName: "आवाज जामखेडचा",
  websiteUrl: "awaazjamkhed.com",
  pageNumberText: "पान १",
  disclaimer: "सर्व हक्क राखीव © आवाज जामखेडचा डिजिटल न्यूजरूम",
};

/**
 * Creates a complete NewspaperPage with populated modules based on selected template and articles.
 */
export function createPageFromTemplate(
  templateId: NewspaperTemplateId,
  pageNumber: number,
  articles: ArticleSummaryItem[]
): NewspaperPage {
  const template = NEWSPAPER_TEMPLATES[templateId] || NEWSPAPER_TEMPLATES["classic-3-col"];
  const pageId = `page_${pageNumber}_${Date.now().toString(36)}`;

  const headerConfig: HeaderConfig = {
    ...DEFAULT_HEADER_CONFIG,
    showMasthead: pageNumber === 1,
  };

  const footerConfig: FooterConfig = {
    ...DEFAULT_FOOTER_CONFIG,
    pageNumberText: `पान ${toDevanagariNumeral(pageNumber)}`,
  };

  const primaryArticle = articles[0];
  const secondaryArticle = articles[1];
  const tertiaryArticle = articles[2];
  const fourthArticle = articles[3];

  const modules: NewspaperModuleConfig[] = [];
  let orderIndex = 1;

  // Header Masthead module on page 1
  if (pageNumber === 1) {
    modules.push({
      id: `${pageId}_mod_masthead`,
      type: "masthead",
      title: headerConfig.publicationName,
      content: headerConfig.tagline,
      order: orderIndex++,
      colSpan: 12,
    });
  }

  // Dateline strip on every page
  modules.push({
    id: `${pageId}_mod_dateline`,
    type: "dateline",
    title: headerConfig.editionName,
    content: `${headerConfig.dateStr} | ${headerConfig.districtStr} | ${headerConfig.issueNumber}`,
    order: orderIndex++,
    colSpan: 12,
  });

  // Assemble modules specific to the chosen template
  switch (templateId) {
    case "hero-news": {
      if (primaryArticle) {
        modules.push({
          id: `${pageId}_mod_lead_label`,
          type: "section-label",
          title: primaryArticle.categoryName || "प्रमुख घडामोड",
          locationTag: primaryArticle.locationName || "जामखेड",
          order: orderIndex++,
          colSpan: 12,
        });

        modules.push({
          id: `${pageId}_mod_lead_headline`,
          type: "headline",
          articleId: primaryArticle.id,
          title: primaryArticle.headline,
          order: orderIndex++,
          colSpan: 12,
          style: { fontFamily: "tiro-press", fontSize: "display", fontWeight: "black", alignment: "left" },
        });

        if (primaryArticle.subheadline) {
          modules.push({
            id: `${pageId}_mod_lead_subhead`,
            type: "subheadline",
            articleId: primaryArticle.id,
            title: primaryArticle.subheadline,
            order: orderIndex++,
            colSpan: 12,
            style: { fontFamily: "mukta", fontSize: "large", fontWeight: "bold" },
          });
        }

        if (primaryArticle.featuredImage) {
          modules.push({
            id: `${pageId}_mod_hero_img`,
            type: "hero-image",
            articleId: primaryArticle.id,
            image: {
              url: primaryArticle.featuredImage,
              caption: `${primaryArticle.locationName}: घटनेचे दृश्य. (छायाचित्र: आवाज जामखेडचा)`,
              objectFit: "cover",
            },
            order: orderIndex++,
            colSpan: 12,
          });
        }

        modules.push({
          id: `${pageId}_mod_lead_body`,
          type: "body-columns",
          articleId: primaryArticle.id,
          title: `${primaryArticle.locationName} (विशेष प्रतिनिधी):`,
          excerpt: primaryArticle.summary || undefined,
          content: primaryArticle.bodyMarkdown,
          order: orderIndex++,
          colSpan: 8,
          style: { fontFamily: "noto-serif", fontSize: "normal", columnCount: 3, alignment: "justify" },
        });
      }

      // Sidebar with secondary story or quote
      if (secondaryArticle) {
        modules.push({
          id: `${pageId}_mod_sidebar_story`,
          type: "side-story",
          articleId: secondaryArticle.id,
          title: secondaryArticle.headline,
          excerpt: secondaryArticle.summary || secondaryArticle.bodyMarkdown.slice(0, 220),
          image: secondaryArticle.featuredImage ? { url: secondaryArticle.featuredImage } : undefined,
          locationTag: secondaryArticle.locationName,
          order: orderIndex++,
          colSpan: 4,
          style: { fontFamily: "mukta", fontSize: "small" },
        });
      }
      break;
    }

    case "classic-2-col": {
      if (primaryArticle) {
        modules.push({
          id: `${pageId}_mod_headline`,
          type: "headline",
          articleId: primaryArticle.id,
          title: primaryArticle.headline,
          locationTag: primaryArticle.locationName,
          categoryName: primaryArticle.categoryName,
          order: orderIndex++,
          colSpan: 12,
          style: { fontFamily: "tiro-press", fontSize: "xl", fontWeight: "bold" },
        });

        if (primaryArticle.featuredImage) {
          modules.push({
            id: `${pageId}_mod_img`,
            type: "single-image",
            articleId: primaryArticle.id,
            image: { url: primaryArticle.featuredImage, caption: primaryArticle.headline },
            order: orderIndex++,
            colSpan: 6,
          });
        }

        modules.push({
          id: `${pageId}_mod_body_col2`,
          type: "body-columns",
          articleId: primaryArticle.id,
          content: primaryArticle.bodyMarkdown,
          excerpt: primaryArticle.summary || undefined,
          order: orderIndex++,
          colSpan: primaryArticle.featuredImage ? 6 : 12,
          style: { fontFamily: "noto-serif", fontSize: "normal", columnCount: 2, alignment: "justify" },
        });
      }

      if (secondaryArticle) {
        modules.push({
          id: `${pageId}_mod_side2`,
          type: "small-story",
          articleId: secondaryArticle.id,
          title: secondaryArticle.headline,
          excerpt: secondaryArticle.summary || secondaryArticle.bodyMarkdown.slice(0, 180),
          locationTag: secondaryArticle.locationName,
          order: orderIndex++,
          colSpan: 12,
        });
      }
      break;
    }

    case "local-press": {
      if (primaryArticle) {
        modules.push({
          id: `${pageId}_mod_local_head`,
          type: "headline",
          articleId: primaryArticle.id,
          title: primaryArticle.headline,
          categoryName: primaryArticle.categoryName,
          locationTag: primaryArticle.locationName,
          order: orderIndex++,
          colSpan: 8,
          style: { fontFamily: "tiro-press", fontSize: "xl", fontWeight: "black" },
        });

        // Fact Box on the side
        modules.push({
          id: `${pageId}_mod_factbox`,
          type: "fact-box",
          title: "महत्त्वाचे मुद्दे (Key Facts)",
          facts: [
            { label: "स्थान", value: primaryArticle.locationName || "जामखेड" },
            { label: "विभाग", value: primaryArticle.categoryName || "स्थानिक" },
            { label: "दिनांक", value: headerConfig.dateStr },
          ],
          order: orderIndex++,
          colSpan: 4,
        });

        if (primaryArticle.featuredImage) {
          modules.push({
            id: `${pageId}_mod_local_img`,
            type: "single-image",
            articleId: primaryArticle.id,
            image: { url: primaryArticle.featuredImage, caption: primaryArticle.headline },
            order: orderIndex++,
            colSpan: 6,
          });
        }

        modules.push({
          id: `${pageId}_mod_local_body`,
          type: "body-columns",
          articleId: primaryArticle.id,
          content: primaryArticle.bodyMarkdown,
          order: orderIndex++,
          colSpan: primaryArticle.featuredImage ? 6 : 8,
          style: { fontFamily: "noto-serif", fontSize: "normal", columnCount: 2, alignment: "justify" },
        });
      }

      if (secondaryArticle) {
        modules.push({
          id: `${pageId}_mod_local_side1`,
          type: "side-story",
          articleId: secondaryArticle.id,
          title: secondaryArticle.headline,
          excerpt: secondaryArticle.summary || secondaryArticle.bodyMarkdown.slice(0, 150),
          locationTag: secondaryArticle.locationName,
          order: orderIndex++,
          colSpan: 6,
        });
      }

      if (tertiaryArticle) {
        modules.push({
          id: `${pageId}_mod_local_side2`,
          type: "side-story",
          articleId: tertiaryArticle.id,
          title: tertiaryArticle.headline,
          excerpt: tertiaryArticle.summary || tertiaryArticle.bodyMarkdown.slice(0, 150),
          locationTag: tertiaryArticle.locationName,
          order: orderIndex++,
          colSpan: 6,
        });
      }
      break;
    }

    case "photo-feature": {
      if (primaryArticle) {
        modules.push({
          id: `${pageId}_mod_photo_head`,
          type: "headline",
          articleId: primaryArticle.id,
          title: `छायाचित्र विशेष: ${primaryArticle.headline}`,
          order: orderIndex++,
          colSpan: 12,
          style: { fontFamily: "tiro-press", fontSize: "display", fontWeight: "black" },
        });

        if (primaryArticle.featuredImage) {
          modules.push({
            id: `${pageId}_mod_photo_hero`,
            type: "hero-image",
            articleId: primaryArticle.id,
            image: {
              url: primaryArticle.featuredImage,
              caption: `${primaryArticle.headline} - छायाचित्र: आवाज जामखेडचा विशेष वृत्त`,
            },
            order: orderIndex++,
            colSpan: 12,
          });
        }

        // Secondary images grid if secondary stories have photos
        const secondaryPhotos = articles
          .slice(1, 4)
          .filter((a) => a.featuredImage)
          .map((a) => ({ url: a.featuredImage!, caption: a.headline }));

        if (secondaryPhotos.length >= 2) {
          modules.push({
            id: `${pageId}_mod_photo_grid`,
            type: "image-grid-2",
            image: secondaryPhotos[0],
            secondaryImages: secondaryPhotos.slice(1),
            order: orderIndex++,
            colSpan: 12,
          });
        }

        modules.push({
          id: `${pageId}_mod_photo_narrative`,
          type: "body-columns",
          articleId: primaryArticle.id,
          content: primaryArticle.bodyMarkdown,
          order: orderIndex++,
          colSpan: 12,
          style: { fontFamily: "noto-serif", fontSize: "normal", columnCount: 3, alignment: "justify" },
        });
      }
      break;
    }

    case "breaking-news": {
      modules.push({
        id: `${pageId}_mod_breaking_strip`,
        type: "breaking-strip",
        title: "🚨 तातडीचे वृत्त (Breaking Bulletin)",
        content: primaryArticle?.headline || "जामखेड परिसरात मोठी घडामोड",
        order: orderIndex++,
        colSpan: 12,
      });

      if (primaryArticle) {
        modules.push({
          id: `${pageId}_mod_breaking_head`,
          type: "headline",
          articleId: primaryArticle.id,
          title: primaryArticle.headline,
          locationTag: primaryArticle.locationName,
          order: orderIndex++,
          colSpan: 12,
          style: { fontFamily: "tiro-press", fontSize: "display", fontWeight: "black", colorHex: "#991B1B" },
        });

        if (primaryArticle.featuredImage) {
          modules.push({
            id: `${pageId}_mod_breaking_img`,
            type: "hero-image",
            articleId: primaryArticle.id,
            image: { url: primaryArticle.featuredImage, caption: "घटनास्थळाचे दृश्य" },
            order: orderIndex++,
            colSpan: 7,
          });
        }

        modules.push({
          id: `${pageId}_mod_breaking_timeline`,
          type: "timeline",
          title: "घडामोडींचा घटनाक्रम (Timeline)",
          timeline: [
            { time: "दुपारी १२:३०", event: "प्राथमिक माहिती समोर आली." },
            { time: "दुपारी १:१५", event: "प्रशासकीय अधिकारी घटनास्थळी दाखल." },
            { time: "दुपारी २:००", event: "नागरिकांशी संवाद व आढावा बैठक सुरू." },
          ],
          order: orderIndex++,
          colSpan: primaryArticle.featuredImage ? 5 : 12,
        });

        modules.push({
          id: `${pageId}_mod_breaking_body`,
          type: "body-columns",
          articleId: primaryArticle.id,
          content: primaryArticle.bodyMarkdown,
          order: orderIndex++,
          colSpan: 12,
          style: { fontFamily: "noto-serif", fontSize: "normal", columnCount: 2 },
        });
      }
      break;
    }

    case "multi-story": {
      articles.slice(0, 5).forEach((art, idx) => {
        if (idx === 0) {
          // Lead story on top
          modules.push({
            id: `${pageId}_mod_lead_${art.id}`,
            type: "headline",
            articleId: art.id,
            title: art.headline,
            categoryName: art.categoryName,
            locationTag: art.locationName,
            order: orderIndex++,
            colSpan: 12,
            style: { fontFamily: "tiro-press", fontSize: "xl", fontWeight: "black" },
          });

          if (art.featuredImage) {
            modules.push({
              id: `${pageId}_mod_img_${art.id}`,
              type: "single-image",
              articleId: art.id,
              image: { url: art.featuredImage, caption: art.headline },
              order: orderIndex++,
              colSpan: 5,
            });
          }

          modules.push({
            id: `${pageId}_mod_body_${art.id}`,
            type: "body-columns",
            articleId: art.id,
            content: art.bodyMarkdown,
            excerpt: art.summary || undefined,
            order: orderIndex++,
            colSpan: art.featuredImage ? 7 : 12,
            style: { fontFamily: "noto-serif", fontSize: "normal", columnCount: 2 },
          });
        } else {
          // Supporting stories below
          modules.push({
            id: `${pageId}_mod_story_${art.id}`,
            type: "small-story",
            articleId: art.id,
            title: art.headline,
            excerpt: art.summary || art.bodyMarkdown.slice(0, 160),
            locationTag: art.locationName,
            categoryName: art.categoryName,
            image: art.featuredImage ? { url: art.featuredImage } : undefined,
            order: orderIndex++,
            colSpan: 6,
          });
        }
      });
      break;
    }

    case "editorial-feature": {
      if (primaryArticle) {
        modules.push({
          id: `${pageId}_mod_ed_label`,
          type: "section-label",
          title: "संपादकीय विश्लेषण व विचारमंथन (Editorial Analysis)",
          order: orderIndex++,
          colSpan: 12,
        });

        modules.push({
          id: `${pageId}_mod_ed_head`,
          type: "headline",
          articleId: primaryArticle.id,
          title: primaryArticle.headline,
          order: orderIndex++,
          colSpan: 12,
          style: { fontFamily: "tiro-press", fontSize: "display", fontWeight: "black" },
        });

        modules.push({
          id: `${pageId}_mod_ed_byline`,
          type: "reporter-byline",
          title: primaryArticle.reporterName ? `विश्लेषण: ${primaryArticle.reporterName}` : "संपादकीय डेस्क, आवाज जामखेडचा",
          content: "विशेष विश्लेषण • सत्यशोधक भूमिका",
          order: orderIndex++,
          colSpan: 12,
        });

        // Prominent quote box
        modules.push({
          id: `${pageId}_mod_ed_quote`,
          type: "quote-box",
          quote: {
            text: primaryArticle.summary || "सत्य, पारदर्शकता आणि लोकशाही मूल्यांचे रक्षण हेच पत्रकारितेचे सर्वोच्च कर्तव्य आहे.",
            speaker: primaryArticle.reporterName || "संपादक",
            designation: "आवाज जामखेडचा",
          },
          order: orderIndex++,
          colSpan: 12,
        });

        modules.push({
          id: `${pageId}_mod_ed_body`,
          type: "body-columns",
          articleId: primaryArticle.id,
          content: primaryArticle.bodyMarkdown,
          order: orderIndex++,
          colSpan: 12,
          style: { fontFamily: "noto-serif", fontSize: "normal", columnCount: 3, alignment: "justify" },
        });
      }
      break;
    }

    case "classic-3-col":
    default: {
      if (primaryArticle) {
        modules.push({
          id: `${pageId}_mod_head3`,
          type: "headline",
          articleId: primaryArticle.id,
          title: primaryArticle.headline,
          categoryName: primaryArticle.categoryName,
          locationTag: primaryArticle.locationName,
          order: orderIndex++,
          colSpan: 12,
          style: { fontFamily: "tiro-press", fontSize: "display", fontWeight: "black" },
        });

        if (primaryArticle.featuredImage) {
          modules.push({
            id: `${pageId}_mod_hero3`,
            type: "hero-image",
            articleId: primaryArticle.id,
            image: { url: primaryArticle.featuredImage, caption: primaryArticle.headline },
            order: orderIndex++,
            colSpan: 8,
          });
        }

        // Side story adjacent to photo
        if (secondaryArticle) {
          modules.push({
            id: `${pageId}_mod_side3`,
            type: "side-story",
            articleId: secondaryArticle.id,
            title: secondaryArticle.headline,
            excerpt: secondaryArticle.summary || secondaryArticle.bodyMarkdown.slice(0, 180),
            locationTag: secondaryArticle.locationName,
            order: orderIndex++,
            colSpan: primaryArticle.featuredImage ? 4 : 12,
          });
        }

        modules.push({
          id: `${pageId}_mod_body3`,
          type: "body-columns",
          articleId: primaryArticle.id,
          content: primaryArticle.bodyMarkdown,
          excerpt: primaryArticle.summary || undefined,
          order: orderIndex++,
          colSpan: 12,
          style: { fontFamily: "noto-serif", fontSize: "normal", columnCount: 3, alignment: "justify" },
        });
      }

      if (tertiaryArticle) {
        modules.push({
          id: `${pageId}_mod_anchor3`,
          type: "small-story",
          articleId: tertiaryArticle.id,
          title: tertiaryArticle.headline,
          excerpt: tertiaryArticle.summary || tertiaryArticle.bodyMarkdown.slice(0, 160),
          locationTag: tertiaryArticle.locationName,
          order: orderIndex++,
          colSpan: 12,
        });
      }
      break;
    }
  }

  // Footer module
  modules.push({
    id: `${pageId}_mod_footer`,
    type: "footer",
    title: footerConfig.publicationName,
    content: `${footerConfig.disclaimer} | अधिकृत संकेतस्थळ: ${footerConfig.websiteUrl} | ${footerConfig.pageNumberText}`,
    order: orderIndex++,
    colSpan: 12,
  });

  return {
    id: pageId,
    pageNumber,
    pageSize: template.defaultPageSize,
    templateId,
    modules,
    headerConfig,
    footerConfig,
  };
}

