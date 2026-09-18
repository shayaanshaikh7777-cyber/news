export interface NewsArticleSEOProps {
  headline: string;
  description: string;
  imageUrl?: string | null;
  datePublished: string;
  dateModified: string;
  authorName: string;
  articleUrl: string;
  categoryName: string;
}

export function generateNewsArticleJSONLD(props: NewsArticleSEOProps) {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://awaazjamkhed.com";

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": props.articleUrl,
    },
    "headline": props.headline,
    "description": props.description,
    "image": props.imageUrl ? [props.imageUrl] : [`${siteUrl}/logo.png`],
    "datePublished": props.datePublished,
    "dateModified": props.dateModified,
    "author": {
      "@type": "Person",
      "name": props.authorName,
    },
    "publisher": {
      "@type": "NewsMediaOrganization",
      "name": "आवाज जामखेडचा (Awaaz Jamkhedcha)",
      "url": siteUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/logo.png`,
      },
    },
    "articleSection": props.categoryName,
    "inLanguage": "mr-IN",
  };
}

export function generateOrganizationJSONLD() {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://awaazjamkhed.com";

  return {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    "name": "आवाज जामखेडचा (Awaaz Jamkhedcha)",
    "alternateName": "Awaaz Jamkhedcha News",
    "url": siteUrl,
    "logo": `${siteUrl}/logo.png`,
    "sameAs": [
      "https://facebook.com/awaazjamkhedcha",
      "https://twitter.com/awaazjamkhedcha",
      "https://instagram.com/awaazjamkhedcha",
      "https://youtube.com/@awaazjamkhedcha",
    ],
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "जामखेड (Jamkhed)",
      "addressRegion": "अहिल्यानगर (Ahilyanagar)",
      "addressCountry": "IN",
    },
  };
}

