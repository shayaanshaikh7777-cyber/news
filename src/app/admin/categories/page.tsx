import React from "react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createCategoryAction } from "@/actions/admin.actions";
import { Layers, Plus } from "lucide-react";

export default async function AdminCategoriesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const categories = await prisma.category.findMany({
    include: { _count: { select: { articles: true } } },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black font-headline text-gray-950 flex items-center gap-2">
            <Layers className="w-6 h-6 text-red-700" />
            <span>विभाग व्यवस्थापन (Categories)</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            बातम्यांचे अधिकृत विभाग आणि क्रमवारी व्यवस्थापित करा.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Create Category Form */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">
            नवीन विभाग जोडा
          </h2>

          <form action={createCategoryAction} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-gray-700 mb-1">विभागाचे नाव (English):</label>
              <input
                type="text"
                name="name"
                required
                placeholder="उदा. Politics"
                className="w-full border border-gray-300 rounded p-2"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">विभागाचे नाव (मराठी):</label>
              <input
                type="text"
                name="nameMarathi"
                required
                placeholder="उदा. राजकारण"
                className="w-full border border-gray-300 rounded p-2 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">URL Slug:</label>
              <input
                type="text"
                name="slug"
                required
                placeholder="उदा. politics"
                className="w-full border border-gray-300 rounded p-2 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">थोडक्यात माहिती:</label>
              <textarea
                name="description"
                rows={2}
                placeholder="या विभागातील बातम्यांचे स्वरूप..."
                className="w-full border border-gray-300 rounded p-2"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-red-800 hover:bg-red-700 text-white font-bold py-2 rounded-lg text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>विभाग जतन करा</span>
            </button>
          </form>
        </div>

        {/* Existing Categories Table */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">
            सध्याचे विभाग ({categories.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-3">मराठी नाव</th>
                  <th className="py-2.5 px-3">इंग्रजी नाव</th>
                  <th className="py-2.5 px-3">Slug</th>
                  <th className="py-2.5 px-3">बातम्या संख्या</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/80">
                    <td className="py-2.5 px-3 font-bold text-gray-950">{c.nameMarathi}</td>
                    <td className="py-2.5 px-3 text-gray-700">{c.name}</td>
                    <td className="py-2.5 px-3 font-mono text-gray-500">{c.slug}</td>
                    <td className="py-2.5 px-3 font-bold text-red-800">
                      {c._count.articles} बातम्या
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
