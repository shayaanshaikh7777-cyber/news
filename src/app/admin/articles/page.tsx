import prisma, { isDatabaseAvailable } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Filter, Eye, Edit, Newspaper, ExternalLink, Database } from "lucide-react";

interface Props {
  searchParams: Promise<{
    status?: string;
    q?: string;
  }>;
}

export default async function AdminArticlesPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const { status = "ALL", q = "" } = await searchParams;

  const whereClause: Record<string, unknown> = {};

  if (status !== "ALL") {
    whereClause.status = status;
  }

  if (q.trim()) {
    whereClause.OR = [
      { headline: { contains: q.trim() } },
      { summary: { contains: q.trim() } },
    ];
  }

  const dbReady = await isDatabaseAvailable();
  let articles: any[] = [];

  if (dbReady) {
    try {
      articles = await prisma.article.findMany({
        where: whereClause as any,
        include: {
          category: true,
          location: true,
          reporter: true,
          createdBy: true,
          _count: { select: { revisions: true } },
        },
        orderBy: { updatedAt: "desc" },
      });
    } catch (e) {
      console.error("[AdminArticlesPage DB error]", e);
    }
  }

  const statuses = [
    { key: "ALL", label: "सर्व (All)" },
    { key: "DRAFT", label: "मसुदा (Draft)" },
    { key: "AI_ASSISTED", label: "AI सहाय्यित (AI Assisted)" },
    { key: "SUBMITTED", label: "सादर (Submitted)" },
    { key: "UNDER_REVIEW", label: "तपासणी सुरू (Under Review)" },
    { key: "REVISION_REQUESTED", label: "दुरुस्ती अपेक्षित (Revision)" },
    { key: "APPROVED", label: "मंजूर (Approved)" },
    { key: "SCHEDULED", label: "नियोजित (Scheduled)" },
    { key: "PUBLISHED", label: "प्रसिद्ध (Published)" },
    { key: "REJECTED", label: "नाकारले (Rejected)" },
  ];

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "PUBLISHED":
        return "bg-green-100 text-green-800 border-green-300";
      case "SUBMITTED":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "UNDER_REVIEW":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "APPROVED":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "REVISION_REQUESTED":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-300";
      case "AI_ASSISTED":
        return "bg-purple-100 text-purple-800 border-purple-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-headline text-gray-950">
            न्यूजरूम वार्ता संकलन (Newsroom Articles)
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            एकूण {articles.length} बातम्या उपलब्ध आहेत.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/ai-studio"
            className="bg-purple-700 hover:bg-purple-600 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-colors shadow-sm"
          >
            ✨ AI न्यूज स्टुडिओ
          </Link>
          <Link
            href="/admin/articles/new"
            className="flex items-center gap-1.5 bg-red-800 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>नवीन बातमी तयार करा</span>
          </Link>
        </div>
      </div>

      {!dbReady && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3 text-xs text-amber-900 dark:text-amber-300">
          <Database className="w-5 h-5 flex-shrink-0 text-amber-600" />
          <div>
            <span className="font-bold">डेटाबेस सध्या उपलब्ध नाही (PostgreSQL Offline / Unconfigured):</span>{" "}
            प्रॉडक्शन डेटाबेसशी संपर्क होऊ शकला नाही. बातम्या व्यवस्थापित करण्यासाठी Vercel मध्ये वैध PostgreSQL DATABASE_URL कॉन्फिगर करा.
          </div>
        </div>
      )}

      {/* Status Filter Bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-gray-200 text-xs font-bold whitespace-nowrap">
        {statuses.map((s) => (
          <Link
            key={s.key}
            href={`/admin/articles?status=${s.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`px-3 py-1.5 rounded-lg border transition-colors ${
              status === s.key
                ? "bg-red-800 text-white border-red-800 shadow-xs"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      {/* Articles Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">शीर्षक व तपशील</th>
                <th className="py-3 px-4">विभाग</th>
                <th className="py-3 px-4">स्थान</th>
                <th className="py-3 px-4">बातमीदार</th>
                <th className="py-3 px-4">स्थिती</th>
                <th className="py-3 px-4">व्ह्यूज</th>
                <th className="py-3 px-4">कृती</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {articles.map((art) => (
                <tr key={art.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3 px-4 max-w-sm">
                    <Link
                      href={`/admin/articles/${art.id}/edit`}
                      className="font-bold text-gray-950 hover:text-red-800 text-sm line-clamp-1"
                    >
                      {art.headline}
                    </Link>
                    <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                      <span>slug: {art.slug}</span>
                      <span>• {art._count.revisions} आवृत्त्या (revisions)</span>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-semibold text-gray-800">
                      {art.category?.nameMarathi || "—"}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="text-gray-600 font-medium">
                      {art.location ? `${art.location.village} (${art.location.taluka})` : "—"}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="text-gray-800 font-semibold">
                      {art.reporter?.nameMarathi || art.createdBy?.name || "न्यूज डेस्क"}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase ${getStatusBadge(
                        art.status
                      )}`}
                    >
                      {art.status}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-mono font-semibold text-gray-700">
                    {art.viewCount.toLocaleString("en-IN")}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/admin/articles/${art.id}/edit`}
                        className="p-1.5 bg-gray-100 hover:bg-red-800 hover:text-white rounded transition-colors text-gray-700"
                        title="संपादित करा"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Link>

                      {art.status === "PUBLISHED" && (
                        <>
                          <Link
                            href={`/news/${art.slug}`}
                            target="_blank"
                            className="p-1.5 bg-gray-100 hover:bg-gray-800 hover:text-white rounded transition-colors text-gray-700"
                            title="थेट पोर्टलवर पाहा"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <a
                            href={`/api/clippings/generate?articleSlug=${art.slug}&format=EPAPER`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-yellow-100 hover:bg-yellow-400 text-yellow-900 rounded transition-colors"
                            title="कात्रण जनरेट करा"
                          >
                            <Newspaper className="w-3.5 h-3.5" />
                          </a>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

