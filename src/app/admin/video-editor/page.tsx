import React from "react";
import prisma, { isDatabaseAvailable } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import VideoStudioStudio from "@/components/admin/video-editor/VideoStudioStudio";
import { FALLBACK_ARTICLES } from "@/lib/fallback-data";
import {
  listVideoProjectsAction,
  loadVideoProjectAction,
  deleteVideoProjectAction,
  VideoProjectSummaryItem,
} from "@/actions/video-project.actions";
import { VIDEO_TEMPLATES, createProjectFromTemplate } from "@/lib/video-editor/templates";
import { VideoProject, VideoTemplateId } from "@/types/video-studio";
import {
  Film,
  Sparkles,
  LayoutTemplate,
  FolderOpen,
  Plus,
  Play,
  Trash2,
  Calendar,
  Clock,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "व्हिडिओ स्टुडिओ (News Video Studio) | आवाज जामखेडचा",
  description: "व्यावसायिक न्यूज व्हिडिओ संपादन, ११ लॅब्स व्हॉईस, लोअर थर्ड्स आणि धावणारा टिकर",
};

interface PageProps {
  searchParams: Promise<{ tab?: string; projectId?: string; templateId?: string }>;
}

export default async function AdminVideoEditorPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const resolvedParams = await searchParams;
  const activeTab = resolvedParams.tab || "editor";
  const requestedProjectId = resolvedParams.projectId;

  // 1. Fetch published articles for Article-to-Video feature
  const dbReady = await isDatabaseAvailable();
  let articles: any[] = [];

  if (dbReady) {
    try {
      articles = await prisma.article.findMany({
        where: { status: "PUBLISHED" },
        include: { location: true, category: true, reporter: true },
        orderBy: { publishedAt: "desc" },
        take: 25,
      });
    } catch (e) {
      console.error("[AdminVideoEditorPage DB error]", e);
    }
  }

  if (articles.length === 0) {
    articles = FALLBACK_ARTICLES.map((a) => ({
      ...a,
      location: { village: "जामखेड" },
      publishedAt: new Date(),
    }));
  }

  const articleMetas = articles.map((a) => ({
    id: a.id,
    title: a.headline || a.title || "महत्त्वाची बातमी",
    excerpt: a.summary || a.subheadline || "",
    featuredImage: a.featuredImage || null,
    categoryName: a.category?.nameMarathi || "स्थानिक बातमी",
    authorName: a.reporter?.nameMarathi || "विशेष प्रतिनिधी",
  }));

  // 2. Load requested project if specified, or initialize from template
  let initialProject: VideoProject | undefined = undefined;
  if (requestedProjectId) {
    const loaded = await loadVideoProjectAction(requestedProjectId);
    if (loaded.success && loaded.data) {
      initialProject = loaded.data;
    }
  } else if (resolvedParams.templateId && VIDEO_TEMPLATES[resolvedParams.templateId as VideoTemplateId]) {
    initialProject = createProjectFromTemplate(resolvedParams.templateId as VideoTemplateId);
  }

  // 3. Load saved projects list
  const projectsListRes = await listVideoProjectsAction();
  const savedProjects: VideoProjectSummaryItem[] = projectsListRes.success ? projectsListRes.data : [];

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-gray-100 font-sans">
      {/* Module Navigation Tabs */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-900/60 border border-red-700 text-red-400">
              <Film className="w-5 h-5" />
            </span>
            <div>
              <h1 className="font-headline font-black text-sm text-white tracking-wide">
                व्हिडिओ स्टुडिओ (News Video Editor)
              </h1>
              <p className="text-[10px] text-gray-400 font-medium">
                आवाज जामखेडचा डिजिटल न्यूजरूम ब्रॉडकास्ट सुट
              </p>
            </div>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1 bg-gray-950 p-1 rounded-lg border border-gray-800 text-xs font-bold">
          <Link
            href="/admin/video-editor?tab=editor"
            prefetch={false}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
              activeTab === "editor"
                ? "bg-red-800 text-white shadow-sm"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>व्हिडिओ स्टुडिओ (Studio)</span>
          </Link>

          <Link
            href="/admin/video-editor?tab=projects"
            prefetch={false}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
              activeTab === "projects"
                ? "bg-red-800 text-white shadow-sm"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-900"
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>जतन प्रकल्प (Projects) ({savedProjects.length})</span>
          </Link>

          <Link
            href="/admin/video-editor?tab=templates"
            prefetch={false}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
              activeTab === "templates"
                ? "bg-red-800 text-white shadow-sm"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-900"
            }`}
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span>टेम्पलेट्स गॅलरी (10 Templates)</span>
          </Link>
        </div>
      </div>

      {/* Main Viewport Content */}
      <div className="flex-1 flex flex-col">
        {activeTab === "editor" && (
          <VideoStudioStudio
            key={initialProject?.id || "new_project"}
            initialProject={initialProject}
            articles={articleMetas}
          />
        )}

        {/* PROJECTS TAB */}
        {activeTab === "projects" && (
          <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div>
                <h2 className="text-xl font-headline font-bold text-white">
                  जतन केलेले व्हिडिओ प्रकल्प (Saved Projects)
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  यापूर्वी तयार केलेले ड्राफ्ट्स, चालू असलेले संपादन किंवा निर्यात केलेले व्हिडिओ.
                </p>
              </div>

              <Link
                href="/admin/video-editor?tab=editor"
                className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition shadow"
              >
                <Plus className="w-4 h-4" />
                <span>नवीन प्रकल्प सुरू करा</span>
              </Link>
            </div>

            {savedProjects.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-gray-800 rounded-xl space-y-3">
                <Film className="w-12 h-12 text-gray-600 mx-auto" />
                <h3 className="font-bold text-gray-300">अद्याप कोणताही व्हिडिओ प्रकल्प जतन केलेला नाही</h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  व्हिडिओ स्टुडिओमध्ये जाऊन नवीन व्हिडिओ तयार करा आणि "प्रकल्प सेव्ह करा" वर क्लिक करा.
                </p>
                <Link
                  href="/admin/video-editor?tab=editor"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-800 text-white text-xs font-bold rounded hover:bg-red-700 mt-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>स्टुडिओ उघडा</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedProjects.map((p: VideoProjectSummaryItem) => (
                  <div
                    key={p.id}
                    className="p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 transition flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-800">
                          {p.canvasRatio}
                        </span>
                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {p.duration} सेकंद
                        </span>
                      </div>

                      <h3 className="font-bold text-gray-100 text-sm line-clamp-2">{p.title}</h3>
                      {p.notes && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{p.notes}</p>}
                    </div>

                    <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-xs">
                      <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(p.updatedAt).toLocaleDateString("mr-IN")}
                      </span>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/video-editor?tab=editor&projectId=${p.id}`}
                          className="px-3 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded font-bold transition flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>उघडा</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TEMPLATES TAB */}
        {activeTab === "templates" && (
          <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
            <div className="border-b border-gray-800 pb-4">
              <h2 className="text-xl font-headline font-bold text-white">
                १० व्यावसायिक वृत्त व्हिडिओ टेम्पलेट्स (Video Templates)
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                प्रत्येक टेम्पलेटमध्ये अधिकृत न्यूज चॅनेल स्टाईल ग्राफिक्स, टिकर, लोअर थर्ड्स आणि पार्श्वसंगीत पूर्वनियोजित आहेत.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Object.values(VIDEO_TEMPLATES).map((tmpl) => (
                <div
                  key={tmpl.templateId}
                  className="p-5 bg-gray-900 border border-gray-800 rounded-xl flex flex-col justify-between hover:border-red-900/60 transition space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-950 text-red-300 border border-red-800 uppercase">
                        {tmpl.badge}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {tmpl.canvasRatio} • {tmpl.defaultDurationSeconds}s
                      </span>
                    </div>

                    <h3 className="font-bold text-gray-100 text-sm">{tmpl.nameMarathi}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{tmpl.description}</p>
                  </div>

                  <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
                    <span className="text-[10px] text-gray-500">{tmpl.nameEnglish}</span>
                    <Link
                      href={`/admin/video-editor?tab=editor&templateId=${tmpl.templateId}`}
                      className="px-3.5 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded font-bold text-xs flex items-center gap-1.5 transition shadow"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>प्रकल्प सुरू करा</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
