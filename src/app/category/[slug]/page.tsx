import React from "react";
import prisma from "@/lib/prisma";
import Header from "@/components/public/Header";
import Navbar from "@/components/public/Navbar";
import NewsCard from "@/components/public/NewsCard";
import AdSlot from "@/components/public/AdSlot";
import Footer from "@/components/public/Footer";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug },
  });

  if (!category) return { title: "विभाग सापडला नाही | आवाज जामखेडचा" };

  return {
    title: `${category.nameMarathi} बातम्या | आवाज जामखेडचा`,
    description: `जामखेड व अहिल्यानगर परिसरातील ${category.nameMarathi} विभागातील ताज्या घडामोडी व विश्लेषण.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;

  const category = await prisma.category.findUnique({
    where: { slug },
  });

  if (!category) {
    notFound();
  }

  const articles = await prisma.article.findMany({
    where: {
      categoryId: category.id,
      status: "PUBLISHED",
    },
    include: {
      category: true,
      location: true,
      reporter: true,
    },
    orderBy: { publishedAt: "desc" },
    take: 24,
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {/* Category Masthead Banner */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 mb-8 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <Link href="/" className="hover:text-red-800">
              मुख्य पृष्ठ
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-bold">{category.nameMarathi}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-4 h-8 bg-red-800 rounded-sm"></span>
            <h1 className="text-3xl sm:text-4xl font-black font-headline text-gray-950">
              {category.nameMarathi} (News Feed)
            </h1>
          </div>

          {category.description && (
            <p className="text-sm text-gray-600 mt-2 max-w-3xl">
              {category.description}
            </p>
          )}
        </div>

        {/* Top Ad */}
        <AdSlot placement="HEADER" />

        {/* Articles Grid */}
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 my-6">
            {articles.map((art) => (
              <NewsCard key={art.id} {...art} layout="vertical" />
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 text-center rounded-xl border border-gray-200 my-8">
            <p className="text-gray-500 font-medium">
              या विभागात सध्या नवीन बातम्या उपलब्ध नाहीत. कृपया नंतर पुन्हा तपासा.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

