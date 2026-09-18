import React from "react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isSuperAdmin, Role } from "@/lib/rbac";
import { updateUserRoleAction } from "@/actions/user.actions";
import { Shield, User, CheckCircle2 } from "lucide-react";

export default async function AdminUsersPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || !isSuperAdmin(currentUser.role)) {
    redirect("/admin");
  }

  const users = await prisma.user.findMany({
    include: { reporterProfile: true },
    orderBy: { createdAt: "asc" },
  });

  const rolesList: { role: Role; label: string }[] = [
    { role: "SUPER_ADMIN", label: "सुपर ॲडमीन (Super Admin)" },
    { role: "EDITOR", label: "संपादक (Editor)" },
    { role: "REPORTER", label: "बातमीदार (Reporter)" },
    { role: "VIEWER", label: "वाचक (Viewer)" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black font-headline text-gray-950 flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-700" />
            <span>वापरकर्ते व भूमिका व्यवस्थापन (Users & RBAC)</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            न्यूजरूममधील प्रत्येक वापरकर्त्याची भूमिका व परवानग्या व्यवस्थापित करा.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">नाव व संपर्क</th>
                <th className="py-3 px-4">सध्याची भूमिका</th>
                <th className="py-3 px-4">बातमीदार प्रोफाइल</th>
                <th className="py-3 px-4">नोंदणी दिनांक</th>
                <th className="py-3 px-4">भूमिका बदला (Change Role)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/80">
                  <td className="py-3 px-4">
                    <div className="font-bold text-gray-950 text-sm">{u.name}</div>
                    <div className="text-[11px] text-gray-500 font-mono">{u.email}</div>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase ${
                        u.role === "SUPER_ADMIN"
                          ? "bg-red-100 text-red-900 border border-red-300"
                          : u.role === "EDITOR"
                          ? "bg-purple-100 text-purple-900 border border-purple-300"
                          : u.role === "REPORTER"
                          ? "bg-blue-100 text-blue-900 border border-blue-300"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    {u.reporterProfile ? (
                      <span className="text-gray-800 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        {u.reporterProfile.nameMarathi}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-gray-500">
                    {new Intl.DateTimeFormat("mr-IN", { dateStyle: "short" }).format(
                      new Date(u.createdAt)
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <form
                      action={async (formData) => {
                        "use server";
                        const newRole = formData.get("newRole") as Role;
                        await updateUserRoleAction(u.id, newRole);
                      }}
                    >
                      <select
                        name="newRole"
                        defaultValue={u.role}
                        className="border border-gray-300 rounded p-1 text-xs font-semibold bg-gray-50"
                      >
                        {rolesList.map((r) => (
                          <option key={r.role} value={r.role}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="ml-2 bg-gray-800 hover:bg-black text-white px-2 py-1 rounded text-[11px] font-bold"
                      >
                        जतन करा
                      </button>
                    </form>
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
