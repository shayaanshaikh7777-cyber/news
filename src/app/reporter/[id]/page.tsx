import React from "react";
import prisma from "@/lib/prisma";
import Header from "@/components/public/Header";
import Navbar from "@/components/public/Navbar";
import NewsCard from "@/components/public/NewsCard";
import Footer from "@/components/public/Footer";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { User, MapPin, CheckCircle, Newspaper, Globe } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const rep = await prisma.reporterProfile.findUnique({
    where: { id },
  });

  if (!rep) return { title: "बातमीदार प्रोफाइल | आवाज जामखेडचा" };

  return {
    title: `${rep.nameMarathi} (${rep.designation}) | आवाज जामखेडचा`,
    description: `${rep.nameMarathi} - ${rep.designation}, आवाज जामखेडचा डिजिटल न्यूजरूम. ${rep.bio || ""}`,
  };
}

export default async function ReporterProfilePage({ params }: Props) {
  const { id } = await params;

  let reporter: any = null;
  try {
    if (process.env.DATABASE_URL) {
      reporter = await prisma.reporterProfile.findUnique({
        where: { id },
        include: {
          user: true,
          articles: {
            where: { status: "PUBLISHED" },
            include: { category: true, location: true, reporter: true },
            orderBy: { publishedAt: "desc" },
          },
        },
      });
    }
  } catch (err) {
    console.warn("ReporterProfilePage DB error, using fallback:", err);
  }

  if (!reporter) {
    const { FALLBACK_ARTICLES } = await import("@/lib/fallback-data");
    reporter = {
      id,
      nameMarathi: "सुनील गायकवाड",
      designation: "मुख्य संपादक व विशेष प्रतिनिधी",
      bio: "जामखेड, खर्डा आणि अहिल्यानगर परिसरातील ज्येष्ठ राजकीय व कृषी विश्लेषक. आवाज जामखेडचा डिजिटल न्यूजरूमचे मुख्य संपादक.",
      location: "जामखेड, अहिल्यानगर",
      isVerified: true,
      socialLinks: JSON.stringify({ twitter: "https://twitter.com", facebook: "https://facebook.com" }),
      user: {
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
      },
      articles: FALLBACK_ARTICLES,
    };
  }

  let socialLinksObj: Record<string, string> = {};
  if (reporter.socialLinks) {
    try {
      socialLinksObj = JSON.parse(reporter.socialLinks);
    } catch {}
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {/* Reporter Header Profile Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="relative w-28 h-28 rounded-full overflow-hidden bg-red-100 border-4 border-white shadow-md flex-shrink-0">
            {reporter.user.avatar ? (
              <Image
                src={reporter.user.avatar}
                alt={reporter.nameMarathi}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-red-800 text-3xl font-black">
                <User className="w-12 h-12" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-black font-headline text-gray-950">
                {reporter.nameMarathi}
              </h1>
              {reporter.isVerified && (
                <span className="inline-flex items-center gap-1 text-blue-600 text-xs font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  <CheckCircle className="w-3.5 h-3.5 fill-blue-600 text-white" />
                  प्रमाणित बातमीदार
                </span>
              )}
            </div>

            <p className="text-sm font-bold text-red-800 mb-2">
              {reporter.designation}
            </p>

            {reporter.location && (
              <p className="text-xs text-gray-500 flex items-center justify-center sm:justify-start gap-1 mb-3">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                {reporter.location}
              </p>
            )}

            {reporter.bio && (
              <p className="text-xs sm:text-sm text-gray-700 max-w-2xl leading-relaxed">
                {reporter.bio}
              </p>
            )}

            {/* Social Links & Meta */}
            <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1">
                <Newspaper className="w-4 h-4 text-red-700" />
                {reporter.articles.length} प्रसिद्ध बातम्या
              </span>

              {socialLinksObj.twitter && (
                <a
                  href={socialLinksObj.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-black"
                >
                  X (Twitter)
                </a>
              )}
              {socialLinksObj.facebook && (
                <a
                  href={socialLinksObj.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-blue-600"
                >
                  Facebook
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Reporter's Article Feed */}
        <div className="pb-3 border-b-2 border-red-800 mb-6">
          <h2 className="text-xl sm:text-2xl font-black font-headline text-gray-950">
            {reporter.nameMarathi} यांचे वार्तांकन ({reporter.articles.length})
          </h2>
        </div>

        {reporter.articles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {reporter.articles.map((art: any) => (
              <NewsCard key={art.id} {...art} layout="vertical" />
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 text-center rounded-xl border border-gray-200">
            <p className="text-gray-500 font-medium">
              सध्या या बातमीदाराच्या ताज्या बातम्या उपलब्ध नाहीत.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

