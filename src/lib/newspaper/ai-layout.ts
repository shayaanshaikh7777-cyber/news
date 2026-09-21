import { aiGateway } from "@/lib/ai/gateway";
import { AILayoutPlan, ArticleSummaryItem, NewspaperTemplateId } from "@/types/newspaper";

/**
 * Deterministic fallback layout planner used when AI provider is offline or unreachable.
 * Analyzes article priorities based on image availability and length.
 */
export function generateDeterministicNewspaperLayout(articles: ArticleSummaryItem[]): AILayoutPlan {
  if (!articles || articles.length === 0) {
    return {
      template: "classic-3-col",
      editorialTheme: "दैनिक स्थानिक घडामोडी",
      storyHierarchy: [],
      reasoning: "कोणतीही बातमी उपलब्ध नसल्याने डीफॉल्ट ३-कॉलम लेआउट निवडला आहे.",
    };
  }

  // Sort: articles with featured images first, then by content length
  const sorted = [...articles].sort((a, b) => {
    if (a.featuredImage && !b.featuredImage) return -1;
    if (!a.featuredImage && b.featuredImage) return 1;
    return b.bodyMarkdown.length - a.bodyMarkdown.length;
  });

  const lead = sorted[0];
  const count = sorted.length;

  let template: NewspaperTemplateId = "classic-3-col";
  if (count === 1 || (lead.featuredImage && count <= 2)) {
    template = "hero-news";
  } else if (count >= 5) {
    template = "multi-story";
  } else if (sorted.some((a) => a.categoryName.includes("स्थानिक") || a.locationName.includes("जामखेड"))) {
    template = "local-press";
  }

  const hierarchy: AILayoutPlan["storyHierarchy"] = sorted.map((art, idx) => {
    if (idx === 0) {
      return {
        articleId: art.id,
        priority: "LEAD",
        recommendedModule: art.featuredImage ? "hero-image" : "headline",
        recommendedColumns: 3,
        recommendedExcerpt: art.summary || art.bodyMarkdown.slice(0, 200),
        keyPoints: [
          `${art.locationName || "जामखेड"} परिसरातील मुख्य बातमी`,
          `प्रशासकीय व स्थानिक पातळीवर महत्त्वाचा परिणाम`,
        ],
      };
    }

    if (idx === 1) {
      return {
        articleId: art.id,
        priority: "SECONDARY",
        recommendedModule: "side-story",
        recommendedColumns: 2,
        recommendedExcerpt: art.summary || art.bodyMarkdown.slice(0, 150),
      };
    }

    return {
      articleId: art.id,
      priority: "BRIEF",
      recommendedModule: "small-story",
      recommendedColumns: 1,
      recommendedExcerpt: art.summary || art.bodyMarkdown.slice(0, 120),
    };
  });

  return {
    template,
    editorialTheme: `${lead.categoryName || "स्थानिक घडामोडी"} आणि जामखेड विशेष वृत्त`,
    leadArticleId: lead.id,
    leadArticleHeadline: lead.headline,
    storyHierarchy: hierarchy,
    quoteSuggestion: lead.summary
      ? {
          text: lead.summary,
          speaker: lead.reporterName || "विशेष प्रतिनिधी",
        }
      : undefined,
    reasoning: `निवडलेल्या ${count} बातम्यांपैकी सर्वात महत्त्वाच्या बातमीला (${lead.headline.slice(0, 30)}...) मुख्य स्थान देऊन '${template}' लेआउटची शिफारस करण्यात आली आहे.`,
  };
}

/**
 * Queries the active AI provider for a structured layout plan,
 * falling back to the deterministic algorithm on error.
 */
export async function suggestNewspaperLayoutWithAI(
  articles: ArticleSummaryItem[],
  options?: { userId?: string }
): Promise<AILayoutPlan> {
  if (!articles || articles.length === 0) {
    return generateDeterministicNewspaperLayout([]);
  }

  const articlesSummary = articles.map((a, i) => ({
    index: i + 1,
    id: a.id,
    headline: a.headline,
    category: a.categoryName,
    location: a.locationName,
    hasImage: Boolean(a.featuredImage),
    wordCount: a.bodyMarkdown.split(/\s+/).length,
    summary: a.summary || a.bodyMarkdown.slice(0, 150),
  }));

  const promptText = `तुम्ही 'आवाज जामखेडचा' वृत्तपत्राचे वरिष्ठ संपादक आहात. खालील ${articles.length} बातम्यांचा अभ्यास करून वर्तमानपत्राच्या पानासाठी सर्वोत्तम वृत्त रचना (Layout Plan) सुचवा.
बातम्यांची यादी:
${JSON.stringify(articlesSummary, null, 2)}

नियम:
१. कोणतीही नवीन माहिती, खोटी विधाने किंवा नसलेली नावे तयार करू नका.
२. योग्य टेम्पलेट निवडा (पर्याय: 'classic-2-col', 'classic-3-col', 'hero-news', 'local-press', 'photo-feature', 'breaking-news', 'multi-story', 'editorial-feature').
३. सर्वात मोठ्या आणि महत्त्वाच्या बातमीला LEAD म्हणून निवडा.
४. फक्त आणि फक्त खालील JSON फॉरमॅटमध्ये उत्तर द्या:
{
  "template": "local-press",
  "editorialTheme": "संपादकीय विषय",
  "leadArticleId": "बातमीची ID",
  "leadArticleHeadline": "मुख्य बातमीचे शीर्षक",
  "storyHierarchy": [
    {
      "articleId": "ID",
      "priority": "LEAD | SECONDARY | SIDEBAR | BRIEF",
      "recommendedModule": "hero-image | headline | side-story | small-story",
      "recommendedColumns": 2,
      "recommendedExcerpt": "१-२ वाक्यांत महत्त्वाचा निष्कर्ष"
    }
  ],
  "reasoning": "मराठीत संपादकीय विश्लेषण"
}`;

  try {
    const aiResult = await aiGateway.generate(
      {
        notes: promptText,
        language: "marathi",
        action: "GENERATE_ARTICLE",
      },
      options
    );

    if (!aiResult.isFallback && aiResult.output) {
      // Look for JSON within response
      const rawText = aiResult.output.body_markdown || aiResult.output.headline || "";
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.template && Array.isArray(parsed.storyHierarchy)) {
          return {
            template: parsed.template,
            editorialTheme: parsed.editorialTheme || "दैनिक आवृत्ती विशेष",
            leadArticleId: parsed.leadArticleId || articles[0].id,
            leadArticleHeadline: parsed.leadArticleHeadline || articles[0].headline,
            storyHierarchy: parsed.storyHierarchy,
            reasoning: parsed.reasoning || "AI द्वारे बातम्यांचे महत्त्व ओळखून रचना सुचवली आहे.",
          };
        }
      }
    }
  } catch (err) {
    console.warn("[suggestNewspaperLayoutWithAI] AI call failed, using deterministic engine:", err);
  }

  // Robust deterministic fallback
  return generateDeterministicNewspaperLayout(articles);
}

