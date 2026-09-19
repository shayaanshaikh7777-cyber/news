import React from "react";
import prisma, { isDatabaseAvailable } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/rbac";
import { History, Shield, User, Database } from "lucide-react";

export default async function AdminAuditLogsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || !isSuperAdmin(currentUser.role)) {
    redirect("/admin");
  }

  const dbReady = await isDatabaseAvailable();
  let logs: any[] = [];

  if (dbReady) {
    try {
      logs = await prisma.auditLog.findMany({
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    } catch (e) {
      console.error("[AdminAuditLogsPage DB error]", e);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black font-headline text-gray-950 flex items-center gap-2">
            <History className="w-6 h-6 text-red-700" />
            <span>ऑडिट नोंदी व सुरक्षा इतिहास (Audit Trail Logs)</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            न्यूजरूममधील प्रत्येक संपादकीय बदल, लॉगिन आणि स्थिती बदलांची कायदेशीर डिजिटल नोंद.
          </p>
        </div>

        <div className="bg-blue-100 text-blue-900 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-blue-700" />
          <span>अपरिवर्तनीय लॉग (Immutable Logs)</span>
        </div>
      </div>

      {!dbReady && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3 text-xs text-amber-900 dark:text-amber-300">
          <Database className="w-5 h-5 flex-shrink-0 text-amber-600" />
          <div>
            <span className="font-bold">डेटाबेस सध्या उपलब्ध नाही (Database Unconfigured):</span>{" "}
            ऑडिट ट्रेल्स लोड करण्यासाठी प्रॉडक्शन PostgreSQL DATABASE_URL आवश्यक आहे.
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">तारीख व वेळ</th>
                <th className="py-3 px-4">वापरकर्ता (User)</th>
                <th className="py-3 px-4">कृती (Action)</th>
                <th className="py-3 px-4">घटक (Entity)</th>
                <th className="py-3 px-4">तपशील (Details)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/80">
                  <td className="py-3 px-4 font-mono text-gray-500 whitespace-nowrap">
                    {new Intl.DateTimeFormat("mr-IN", {
                      dateStyle: "short",
                      timeStyle: "medium",
                    }).format(new Date(log.createdAt))}
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-bold text-gray-900">
                      {log.user?.name || "प्रणाली (System)"}
                    </span>
                    {log.user && (
                      <span className="text-[10px] text-gray-400 block font-mono">
                        {log.user.email}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-red-800 bg-red-50 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-semibold text-gray-700">{log.entity}</td>

                  <td className="py-3 px-4 max-w-xs truncate font-mono text-[11px] text-gray-600">
                    {log.details || "—"}
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

