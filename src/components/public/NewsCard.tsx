import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, MapPin, User } from "lucide-react";

export interface ArticleCardProps {
  id: string;
  headline: string;
  subheadline?: string | null;
  summary?: string | null;
  slug: string;
  featuredImage?: string | null;
  publishedAt?: Date | string | null;
  readingTimeMinutes?: number;
  category?: {
    nameMarathi: string;
    slug: string;
    color?: string;
  } | null;
  location?: {
    village: string;
    taluka: string;
    slug: string;
  } | null;
  reporter?: {
    nameMarathi: string;
    id: string;
  } | null;
  viewCount?: number;
  layout?: "vertical" | "horizontal" | "compact";
}

export default function NewsCard({
  headline,
  summary,
  slug,
  featuredImage,
  publishedAt,
  readingTimeMinutes = 3,
  category,
  location,
  reporter,
  layout = "vertical",
}: ArticleCardProps) {
  const timeFormatted = publishedAt
    ? new Intl.DateTimeFormat("mr-IN", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "numeric",
      }).format(new Date(publishedAt))
    : "";

  const defaultImg =
    "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80";
  const imageSrc = featuredImage || defaultImg;

  if (layout === "horizontal") {
    return (
      <article className="group flex flex-col sm:flex-row gap-4 bg-white p-3.5 rounded-lg border border-gray-200 hover:border-red-600 transition-all hover:shadow-md">
        <div className="sm:w-1/3 relative aspect-[16/10] sm:aspect-auto overflow-hidden rounded bg-gray-100 flex-shrink-0">
          <Image
            src={imageSrc}
            alt={headline}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, 30vw"
          />
        </div>

        <div className="sm:w-2/3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {category && (
                <Link
                  href={`/category/${category.slug}`}
                  className="text-[11px] font-bold uppercase tracking-wider text-red-700 hover:text-red-900"
                >
                  {category.nameMarathi}
                </Link>
              )}
              {location && (
                <span className="text-[11px] text-gray-500 flex items-center gap-0.5">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  {location.village}
                </span>
              )}
            </div>

            <Link href={`/news/${slug}`}>
              <h3 className="font-bold text-base sm:text-lg text-gray-900 group-hover:text-red-800 transition-colors leading-snug line-clamp-2">
                {headline}
              </h3>
            </Link>

            {summary && (
              <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                {summary}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-500 mt-2.5 pt-2 border-t border-gray-100">
            {reporter && (
              <Link
                href={`/reporter/${reporter.id}`}
                className="hover:text-gray-900 font-semibold flex items-center gap-1 truncate max-w-[150px]"
              >
                <User className="w-3 h-3" />
                {reporter.nameMarathi}
              </Link>
            )}
            <div className="flex items-center gap-2 ml-auto">
              {publishedAt && <span>{timeFormatted}</span>}
              <span>• {readingTimeMinutes} मि. वाचन</span>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (layout === "compact") {
    return (
      <article className="group py-2.5 border-b border-gray-200 last:border-b-0 hover:bg-red-50/40 p-2 rounded transition-colors">
        <div className="flex items-center gap-2 mb-1">
          {category && (
            <span className="text-[10px] font-extrabold text-red-700 uppercase">
              {category.nameMarathi}
            </span>
          )}
          {location && (
            <span className="text-[10px] text-gray-500">
              📍 {location.village}
            </span>
          )}
        </div>
        <Link href={`/news/${slug}`}>
          <h4 className="text-sm font-bold text-gray-900 group-hover:text-red-800 leading-snug line-clamp-2">
            {headline}
          </h4>
        </Link>
        <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-1">
          {timeFormatted && <span>{timeFormatted}</span>}
          {reporter && <span>• {reporter.nameMarathi}</span>}
        </div>
      </article>
    );
  }

  // Default Vertical Layout
  return (
    <article className="group flex flex-col bg-white rounded-lg border border-gray-200 hover:border-red-700 transition-all hover:shadow-md overflow-hidden">
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
        <Image
          src={imageSrc}
          alt={headline}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        {category && (
          <div className="absolute top-2.5 left-2.5">
            <Link
              href={`/category/${category.slug}`}
              className="bg-red-800/95 hover:bg-red-900 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-sm"
            >
              {category.nameMarathi}
            </Link>
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {location && (
            <div className="flex items-center gap-1 text-[11px] text-gray-500 font-semibold mb-1">
              <MapPin className="w-3 h-3 text-red-700" />
              <span>{location.village} ({location.taluka})</span>
            </div>
          )}

          <Link href={`/news/${slug}`}>
            <h3 className="font-bold text-base sm:text-lg text-gray-900 group-hover:text-red-800 transition-colors leading-snug line-clamp-2">
              {headline}
            </h3>
          </Link>

          {summary && (
            <p className="text-xs sm:text-sm text-gray-600 mt-1.5 line-clamp-2 leading-relaxed">
              {summary}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-500 mt-3 pt-2.5 border-t border-gray-100">
          {reporter ? (
            <Link
              href={`/reporter/${reporter.id}`}
              className="hover:text-gray-900 font-semibold flex items-center gap-1 truncate"
            >
              <User className="w-3 h-3" />
              <span>{reporter.nameMarathi}</span>
            </Link>
          ) : (
            <span className="font-semibold">विशेष बातमीदार</span>
          )}

          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{timeFormatted.split(",")[0] || "आज"}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

