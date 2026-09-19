import React from "react";
import { isDatabaseAvailable } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Image as ImageIcon, Database } from "lucide-react";
import MediaLibraryClient from "@/components/admin/MediaLibraryClient";
import { getMediaListAction } from "@/actions/media.actions";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const dbReady = await isDatabaseAvailable();
  const { assets, total, totalSavedBytes } = await getMediaListAction({
    page: 1,
    pageSize: 32,
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-marathi">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black font-headline text-gray-950 flex items-center gap-2">
            <ImageIcon className="w-7 h-7 text-red-700" />
            <span>मीडिया व इमेज ऑप्टिमायझेशन (Media & Image Optimization)</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            न्यूजरूमसाठी स्वयंचलित Sharp कॉम्प्रेशन • WebP आणि AVIF फॉरमॅट्स • द्रुतगती लोडिंग व बँडविड्थ बचत.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs font-bold">
            एकूण {total} फोटो उपलब्ध
          </span>
        </div>
      </div>

      {!dbReady && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3 text-xs text-amber-900 dark:text-amber-300">
          <Database className="w-5 h-5 flex-shrink-0 text-amber-600" />
          <div>
            <span className="font-bold">डेटाबेस सूचना:</span>{" "}
            अपलोड केलेल्या इमेजचे मेटाडेटा कायमस्वरूपी जतन करण्यासाठी वैध PostgreSQL डेटाबेस आवश्यक आहे.
          </div>
        </div>
      )}

      {/* Interactive Media Library Client */}
      <MediaLibraryClient
        initialAssets={assets}
        totalCount={total}
        totalSavedBytes={totalSavedBytes}
        dbReady={dbReady}
      />
    </div>
  );
}
