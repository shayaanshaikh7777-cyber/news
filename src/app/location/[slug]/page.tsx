import React from "react";
import prisma from "@/lib/prisma";
import Header from "@/components/public/Header";
import Navbar from "@/components/public/Navbar";
import NewsCard from "@/components/public/NewsCard";
import AdSlot from "@/components/public/AdSlot";
import Footer from "@/components/public/Footer";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

import { FALLBACK_LOCATIONS, FALLBACK_ARTICLES } from "@/lib/fallback-data";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let loc: any = null;

  try {
    if (process.env.DATABASE_URL) {
      loc = await prisma.location.findUnique({
        where: { slug },
      });
    }
  } catch {
    // ignore
  }

  if (!loc) {
    loc = FALLBACK_LOCATIONS.find((l) => l.slug === slug) || null;
  }

  if (!loc) return { title: "गाव बातमीपत्र | आवाज जामखेडचा" };

  return {
    title: `${loc.village} गावच्या बातम्या | आवाज जामखेडचा`,
    description: `${loc.village}, ता. ${loc.taluka}, जि. ${loc.district} परिसरातील स्थानिक घडामोडी, शेती, ग्रामपंचायत आणि ताज्या बातम्या.`,
  };
}

export default async function LocationPage({ params }: Props) {
  const { slug } = await params;
  let location: any = null;

  try {
    if (process.env.DATABASE_URL) {
      location = await prisma.location.findUnique({
        where: { slug },
      });
    }
  } catch {
    // ignore
  }

  if (!location) {
    location = FALLBACK_LOCATIONS.find((l) => l.slug === slug) || null;
  }

  if (!location) {
    notFound();
  }

  let articles: any[] = [];
  try {
    if (process.env.DATABASE_URL && location.id) {
      articles = await prisma.article.findMany({
        where: {
          locationId: location.id,
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
    }
  } catch {
    // ignore
  }

  if (articles.length === 0) {
    articles = FALLBACK_ARTICLES.filter(
      (a) => a.location?.slug === slug || a.locationId === location.id
    );
  }

  let otherVillages: any[] = [];
  try {
    if (process.env.DATABASE_URL && location.id) {
      otherVillages = await prisma.location.findMany({
        where: {
          id: { not: location.id },
        },
        orderBy: { village: "asc" },
        take: 8,
      });
    }
  } catch {
    // ignore
  }

  if (otherVillages.length === 0) {
    otherVillages = FALLBACK_LOCATIONS.filter((l) => l.slug !== slug).slice(0, 8);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {/* Village Masthead Header */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 mb-8 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <Link href="/" className="hover:text-red-800">
              मुख्य पृष्ठ
            </Link>
            <span>/</span>
            <span>{location.district}</span>
            <span>/</span>
            <span>{location.taluka}</span>
            <span>/</span>
            <span className="text-gray-900 font-bold">{location.village}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-800 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black font-headline text-gray-950">
                {location.village} विशेष वार्ता
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                तालुका: {location.taluka} • जिल्हा: {location.district}
              </p>
            </div>
          </div>
        </div>

        {/* Other Villages Quick Bar */}
        <div className="bg-red-50 p-4 rounded-xl border border-red-200 mb-8">
          <p className="text-xs font-bold text-red-900 mb-2 uppercase tracking-wide">
            {location.taluka} तालुक्यातील इतर गावे:
          </p>
          <div className="flex flex-wrap gap-2">
            {otherVillages.map((v) => (
              <Link
                key={v.slug}
                href={`/location/${v.slug}`}
                className="bg-white hover:bg-red-800 hover:text-white text-gray-800 text-xs px-2.5 py-1 rounded-full border border-gray-200 transition-colors font-medium shadow-xs"
              >
                📍 {v.village}
              </Link>
            ))}
          </div>
        </div>

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
              {location.village} या गावासाठी सध्या ताज्या बातम्या दाखल झालेल्या नाहीत. आमचे बातमीदार लवकरच माहिती अपडेट करतील.
            </p>
          </div>
        )}

        <AdSlot placement="FOOTER" />
      </main>

      <Footer />
    </div>
  );
}

