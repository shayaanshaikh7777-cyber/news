import React from "react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createLocationAction } from "@/actions/admin.actions";
import { MapPin, Plus } from "lucide-react";

export default async function AdminLocationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const locations = await prisma.location.findMany({
    include: { _count: { select: { articles: true } } },
    orderBy: { village: "asc" },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black font-headline text-gray-950 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-red-700" />
            <span>स्थान व गावनिहाय वर्गवारी (Locations Taxonomy)</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            जिल्हा → तालुका → गाव पदानुक्रम (Hierarchy) व्यवस्थापन.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Create Location Form */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">
            नवीन गाव / स्थान जोडा
          </h2>

          <form action={createLocationAction} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-gray-700 mb-1">जिल्हा (District):</label>
              <input
                type="text"
                name="district"
                required
                defaultValue="अहिल्यानगर"
                className="w-full border border-gray-300 rounded p-2 font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">तालुका (Taluka):</label>
              <input
                type="text"
                name="taluka"
                required
                defaultValue="जामखेड"
                className="w-full border border-gray-300 rounded p-2 font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">गाव / शहर (Village):</label>
              <input
                type="text"
                name="village"
                required
                placeholder="उदा. खर्डा / चोंडी / सावरगाव"
                className="w-full border border-gray-300 rounded p-2 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">URL Slug:</label>
              <input
                type="text"
                name="slug"
                required
                placeholder="उदा. kharda"
                className="w-full border border-gray-300 rounded p-2 font-mono"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input type="checkbox" name="isHotspot" value="true" id="hotspot" className="accent-red-700" />
              <label htmlFor="hotspot" className="font-bold text-gray-800">
                प्रमुख केंद्र (Hotspot) म्हणून मार्क करा
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-red-800 hover:bg-red-700 text-white font-bold py-2 rounded-lg text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>स्थान जतन करा</span>
            </button>
          </form>
        </div>

        {/* Existing Locations Table */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">
            नोंदणीकृत गावे ({locations.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-3">गाव</th>
                  <th className="py-2.5 px-3">तालुका</th>
                  <th className="py-2.5 px-3">जिल्हा</th>
                  <th className="py-2.5 px-3">हॉटस्पॉट</th>
                  <th className="py-2.5 px-3">बातम्या</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {locations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-gray-50/80">
                    <td className="py-2.5 px-3 font-bold text-gray-950">📍 {loc.village}</td>
                    <td className="py-2.5 px-3 text-gray-700">{loc.taluka}</td>
                    <td className="py-2.5 px-3 text-gray-600">{loc.district}</td>
                    <td className="py-2.5 px-3">
                      {loc.isHotspot ? (
                        <span className="bg-yellow-100 text-yellow-900 px-2 py-0.5 rounded font-black text-[10px]">
                          ★ हॉटस्पॉट
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-red-800">
                      {loc._count.articles}
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
