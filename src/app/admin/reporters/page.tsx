import React from "react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, CheckCircle, ExternalLink, Mail, MapPin } from "lucide-react";

export default async function AdminReportersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const reporters = await prisma.reporterProfile.findMany({
    include: {
      user: true,
      _count: { select: { articles: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black font-headline text-gray-950 flex items-center gap-2">
            <Users className="w-6 h-6 text-red-700" />
            <span>बातमीदार व प्रतिनिधी मंडळ (Reporters & Correspondents)</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            न्यूजरूममधील सर्व अधिकृत वार्ताहर आणि बातमीदार प्रोफाइल्स व्यवस्थापित करा.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reporters.map((rep) => (
          <div
            key={rep.id}
            className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-start gap-4"
          >
            <div className="w-16 h-16 rounded-full overflow-hidden bg-red-100 flex-shrink-0 border-2 border-red-800">
              {rep.user.avatar ? (
                <img src={rep.user.avatar} alt={rep.nameMarathi} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-red-800 text-xl">
                  {rep.nameMarathi[0]}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-950 truncate">{rep.nameMarathi}</h3>
                {rep.isVerified && (
                  <CheckCircle className="w-4 h-4 text-blue-600 fill-blue-100 flex-shrink-0" />
                )}
              </div>

              <p className="text-xs font-semibold text-red-800 mt-0.5">{rep.designation}</p>

              <div className="space-y-1 mt-2 text-xs text-gray-500">
                <p className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span>{rep.location || "जामखेड"}</span>
                </p>
                <p className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <span>{rep.user.email}</span>
                </p>
              </div>

              {rep.bio && (
                <p className="text-xs text-gray-600 mt-2 line-clamp-2 leading-relaxed bg-gray-50 p-2 rounded">
                  {rep.bio}
                </p>
              )}

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="font-bold text-red-800">
                  {rep._count.articles} प्रसिद्ध बातम्या
                </span>
                <Link
                  href={`/reporter/${rep.id}`}
                  target="_blank"
                  className="text-gray-600 hover:text-red-800 font-semibold flex items-center gap-1"
                >
                  <span>सार्वजनिक प्रोफाइल</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

