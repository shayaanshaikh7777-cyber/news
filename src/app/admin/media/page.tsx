import React from "react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Image as ImageIcon, Upload, ExternalLink, Check, Copy } from "lucide-react";

export default async function AdminMediaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  // Fetch articles that have featured images or gallery images
  const articlesWithImages = await prisma.article.findMany({
    where: { featuredImage: { not: null } },
    select: { id: true, headline: true, featuredImage: true, publishedAt: true },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black font-headline text-gray-950 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-red-700" />
            <span>मीडिया लायब्ररी (Newsroom Media Library)</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            न्यूजरूममध्ये वापरलेले सर्व फोटो, कात्रणे आणि ग्राफिक्स.
          </p>
        </div>
      </div>

      {/* Cloud Object Storage Status Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 font-semibold text-gray-700">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
          <span>स्टोरेज इंजिन: Sharp + Local/S3 Object Storage Abstraction</span>
        </div>
        <div className="text-gray-500">
          समर्थित फॉरमॅट्स: WebP, AVIF, PNG, JPEG (कमाल आकार: १०MB)
        </div>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {articlesWithImages.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden group hover:border-red-700 transition-all flex flex-col justify-between"
          >
            <div className="relative aspect-video w-full bg-gray-100 overflow-hidden">
              <img
                src={item.featuredImage!}
                alt={item.headline}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>

            <div className="p-3">
              <p className="text-xs font-bold text-gray-900 line-clamp-1">{item.headline}</p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 text-[10px] text-gray-500">
                <a
                  href={item.featuredImage!}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-red-800 flex items-center gap-1 font-semibold"
                >
                  <span>फोटो पाहा</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
