"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ArticleSummaryItem,
  NewspaperEdition,
  NewspaperPage,
  NewspaperTemplateId,
  NewspaperModuleConfig,
} from "@/types/newspaper";
import { createPageFromTemplate, DEFAULT_HEADER_CONFIG, DEFAULT_FOOTER_CONFIG } from "@/lib/newspaper/templates";
import { exportElementToImage, exportNewspaperToPDF, validateNewspaperEdition } from "@/lib/newspaper/exporter";
import { saveNewspaperEditionAction } from "@/actions/newspaper.actions";
import { NewspaperCanvas } from "./NewspaperCanvas";
import { ModuleInspector } from "./ModuleInspector";
import { ArticleSelectorDrawer } from "./ArticleSelectorDrawer";
import { PageManager } from "./PageManager";
import {
  Save,
  Undo,
  Redo,
  Sparkles,
  Download,
  Printer,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileImage,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";

interface StudioProps {
  initialArticles: ArticleSummaryItem[];
  initialEdition?: NewspaperEdition | null;
}

export function NewspaperBuilderStudio({ initialArticles, initialEdition }: StudioProps) {
  // Initialize edition state
  const [edition, setEdition] = useState<NewspaperEdition>(() => {
    if (initialEdition) return initialEdition;

    const initialPage = createPageFromTemplate("classic-3-col", 1, initialArticles);
    return {
      id: `edition_${Date.now().toString(36)}`,
      title: `दैनिक आवाज जामखेडचा - ${new Intl.DateTimeFormat("mr-IN", { dateStyle: "long" }).format(new Date())}`,
      editionDate: new Intl.DateTimeFormat("mr-IN", { dateStyle: "long" }).format(new Date()),
      issueNumber: "अंक: १",
      district: "अहिल्यानगर",
      pages: [initialPage],
      status: "DRAFT",
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>(() =>
    initialArticles.slice(0, 3).map((a) => a.id)
  );

  // Undo / Redo history
  const [history, setHistory] = useState<NewspaperEdition[]>([edition]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // UI state
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>("");
  const [showLeftDrawer, setShowLeftDrawer] = useState<boolean>(true);
  const [showRightInspector, setShowRightInspector] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);

  const currentPage = edition.pages[activePageIndex] || edition.pages[0];
  const selectedModule = currentPage?.modules.find((m) => m.id === selectedModuleId) || null;

  // Push state to history on changes
  const pushState = (newEdition: NewspaperEdition) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    setHistory([...updatedHistory, newEdition]);
    setHistoryIndex(updatedHistory.length);
    setEdition(newEdition);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setEdition(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setEdition(history[historyIndex + 1]);
    }
  };

  // Article selection toggler
  const handleToggleSelectArticle = (articleId: string) => {
    setSelectedArticleIds((prev) =>
      prev.includes(articleId) ? prev.filter((id) => id !== articleId) : [...prev, articleId]
    );
  };

  // Apply template to active page
  const handleApplyTemplate = (templateId: NewspaperTemplateId) => {
    const selectedArticles = initialArticles.filter((a) => selectedArticleIds.includes(a.id));
    const articlesToUse = selectedArticles.length > 0 ? selectedArticles : initialArticles;

    const newPage = createPageFromTemplate(templateId, activePageIndex + 1, articlesToUse);
    const updatedPages = [...edition.pages];
    updatedPages[activePageIndex] = newPage;

    pushState({
      ...edition,
      pages: updatedPages,
      updatedAt: new Date().toISOString(),
    });
  };

  // AI Layout suggestion action
  const handleRunAILayout = async () => {
    const selectedArticles = initialArticles.filter((a) => selectedArticleIds.includes(a.id));
    if (selectedArticles.length === 0) {
      alert("कृपया आधी किमान १ बातमी निवडा.");
      return;
    }

    setIsAiLoading(true);
    setSaveMessage("");

    try {
      const res = await fetch("/api/admin/newspaper/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articles: selectedArticles }),
      });

      const json = await res.json();
      if (res.ok && json.data) {
        const plan = json.data;
        const newPage = createPageFromTemplate(plan.template, activePageIndex + 1, selectedArticles);

        const updatedPages = [...edition.pages];
        updatedPages[activePageIndex] = newPage;

        pushState({
          ...edition,
          pages: updatedPages,
          updatedAt: new Date().toISOString(),
        });

        setSaveMessage(`✅ AI ने '${plan.template}' लेआउट सुचवले आणि लागू केले!`);
      } else {
        alert(json.error || "AI रचना करताना त्रुटी आली.");
      }
    } catch (err) {
      console.error("[handleRunAILayout] Error:", err);
      alert("AI सर्व्हरशी संपर्क साधता आला नाही.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Module actions: update, move, delete
  const handleUpdateModule = (updatedModule: NewspaperModuleConfig) => {
    const updatedModules = currentPage.modules.map((m) =>
      m.id === updatedModule.id ? updatedModule : m
    );

    const updatedPages = [...edition.pages];
    updatedPages[activePageIndex] = {
      ...currentPage,
      modules: updatedModules,
    };

    pushState({
      ...edition,
      pages: updatedPages,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleMoveModule = (moduleId: string, direction: "up" | "down") => {
    const idx = currentPage.modules.findIndex((m) => m.id === moduleId);
    if (idx === -1) return;

    if (direction === "up" && idx > 0) {
      const updatedModules = [...currentPage.modules];
      const temp = updatedModules[idx - 1];
      updatedModules[idx - 1] = updatedModules[idx];
      updatedModules[idx] = temp;

      const updatedPages = [...edition.pages];
      updatedPages[activePageIndex] = { ...currentPage, modules: updatedModules };
      pushState({ ...edition, pages: updatedPages });
    } else if (direction === "down" && idx < currentPage.modules.length - 1) {
      const updatedModules = [...currentPage.modules];
      const temp = updatedModules[idx + 1];
      updatedModules[idx + 1] = updatedModules[idx];
      updatedModules[idx] = temp;

      const updatedPages = [...edition.pages];
      updatedPages[activePageIndex] = { ...currentPage, modules: updatedModules };
      pushState({ ...edition, pages: updatedPages });
    }
  };

  const handleDeleteModule = (moduleId: string) => {
    const updatedModules = currentPage.modules.filter((m) => m.id !== moduleId);
    const updatedPages = [...edition.pages];
    updatedPages[activePageIndex] = { ...currentPage, modules: updatedModules };

    if (selectedModuleId === moduleId) {
      setSelectedModuleId(null);
    }

    pushState({ ...edition, pages: updatedPages });
  };

  // Page operations
  const handleAddPage = () => {
    const nextNum = edition.pages.length + 1;
    const newPage = createPageFromTemplate("classic-2-col", nextNum, initialArticles);

    pushState({
      ...edition,
      pages: [...edition.pages, newPage],
    });
    setActivePageIndex(edition.pages.length);
  };

  const handleDuplicatePage = (index: number) => {
    const target = edition.pages[index];
    const duplicated: NewspaperPage = {
      ...target,
      id: `page_${Date.now().toString(36)}`,
      pageNumber: edition.pages.length + 1,
      modules: target.modules.map((m) => ({
        ...m,
        id: `${m.id}_copy_${Date.now().toString(36).slice(-4)}`,
      })),
    };

    pushState({
      ...edition,
      pages: [...edition.pages, duplicated],
    });
  };

  const handleDeletePage = (index: number) => {
    if (edition.pages.length <= 1) {
      alert("वृत्तपत्रात किमान १ पान असणे आवश्यक आहे.");
      return;
    }

    const updated = edition.pages.filter((_, i) => i !== index);
    // Renumber remaining pages
    const renumbered = updated.map((p, i) => ({
      ...p,
      pageNumber: i + 1,
      footerConfig: { ...p.footerConfig, pageNumberText: `पान ${i + 1}` },
    }));

    pushState({ ...edition, pages: renumbered });
    setActivePageIndex(Math.max(0, index - 1));
  };

  const handleMovePage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= edition.pages.length) return;

    const reordered = [...edition.pages];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    const renumbered = reordered.map((p, i) => ({
      ...p,
      pageNumber: i + 1,
      footerConfig: { ...p.footerConfig, pageNumberText: `पान ${i + 1}` },
    }));

    pushState({ ...edition, pages: renumbered });
    setActivePageIndex(toIndex);
  };

  // Save edition
  const handleSaveEdition = async () => {
    setIsSaving(true);
    setSaveMessage("");

    try {
      const res = await saveNewspaperEditionAction(edition);
      if (res.success) {
        setSaveMessage("✅ वृत्तपत्र आवृत्ती यशस्वीरीत्या सेव्ह झाली!");
        setTimeout(() => setSaveMessage(""), 3000);
      } else {
        alert(res.error || "सेव्ह करताना त्रुटी आली.");
      }
    } catch (err) {
      console.error("Save edition error:", err);
      alert("सेव्ह करताना तांत्रिक अडचण आली.");
    } finally {
      setIsSaving(false);
    }
  };

  // Export handlers
  const handleExportImage = async (format: "png" | "jpeg") => {
    setExporting(true);
    setShowExportMenu(false);

    try {
      const canvasEl = document.getElementById(`newspaper-page-canvas-${currentPage.pageNumber}`);
      if (!canvasEl) {
        alert("कॅनव्हास घटक सापडला नाही.");
        return;
      }

      await exportElementToImage(
        canvasEl,
        format,
        `awaaz-jamkhedcha-page-${currentPage.pageNumber}`
      );
    } catch (err) {
      console.error("Export image error:", err);
      alert("इमेज तयार करताना त्रुटी आली. कृपया प्रिंट PDF पर्याय वापरा.");
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = () => {
    setShowExportMenu(false);
    exportNewspaperToPDF();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-100 text-gray-900 overflow-hidden font-marathi">
      {/* 1. Top Global Studio Toolbar */}
      <header className="no-print bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between gap-4 z-20 shadow-xs">
        {/* Left Side: Title & Drawer Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowLeftDrawer((prev) => !prev)}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
            title="बातम्या यादी उघडा/बंद करा"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div>
            <input
              type="text"
              value={edition.title}
              onChange={(e) => setEdition({ ...edition, title: e.target.value })}
              className="font-bold text-sm text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-red-700 focus:outline-none px-1"
            />
            <div className="text-[10px] text-gray-500 px-1">
              दिनांक: {edition.editionDate} | {edition.district} | एकूण पाने: {edition.pages.length}
            </div>
          </div>
        </div>

        {/* Center: Undo / Redo & Status */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex === 0}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
            title="Undo (मागे जा)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
            title="Redo (पुढे जा)"
          >
            <Redo className="w-4 h-4" />
          </button>

          {saveMessage && (
            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded">
              {saveMessage}
            </span>
          )}
        </div>

        {/* Right Side: Save & Export Actions */}
        <div className="flex items-center gap-2">
          {/* Save Button */}
          <button
            type="button"
            onClick={handleSaveEdition}
            disabled={isSaving}
            className="flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold px-3 py-1.5 rounded-lg text-xs shadow-xs transition disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-red-700" />}
            <span>सेव्ह करा</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu((prev) => !prev)}
              disabled={exporting}
              className="flex items-center gap-1.5 bg-red-800 hover:bg-red-700 text-white font-black px-3.5 py-1.5 rounded-lg text-xs shadow transition disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>एक्सपोर्ट (Export)</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white border border-gray-200 rounded-xl shadow-xl p-1.5 z-50 text-xs space-y-1">
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left font-bold text-gray-800 hover:bg-red-50 hover:text-red-900 rounded-lg"
                >
                  <Printer className="w-4 h-4 text-red-700" />
                  <span>प्रिंट / PDF एक्सपोर्ट</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportImage("png")}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left font-bold text-gray-800 hover:bg-red-50 hover:text-red-900 rounded-lg"
                >
                  <FileImage className="w-4 h-4 text-emerald-700" />
                  <span>PNG इमेज (High-Res)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportImage("jpeg")}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left font-bold text-gray-800 hover:bg-red-50 hover:text-red-900 rounded-lg"
                >
                  <FileImage className="w-4 h-4 text-blue-700" />
                  <span>JPG इमेज (Social)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Studio Workspace: Left Drawer + Center Canvas + Right Inspector */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left Side Drawer: Articles & Templates */}
        {showLeftDrawer && (
          <aside className="w-72 sm:w-80 flex-shrink-0 h-full overflow-hidden z-10">
            <ArticleSelectorDrawer
              articles={initialArticles}
              selectedArticleIds={selectedArticleIds}
              onToggleSelectArticle={handleToggleSelectArticle}
              onApplyTemplate={handleApplyTemplate}
              onRunAILayout={handleRunAILayout}
              isAiLoading={isAiLoading}
              currentTemplateId={currentPage.templateId}
            />
          </aside>
        )}

        {/* Center Canvas Viewport */}
        <main className="flex-1 h-full overflow-y-auto bg-gray-200/80 flex flex-col items-center p-4">
          <NewspaperCanvas
            page={currentPage}
            selectedModuleId={selectedModuleId}
            onSelectModule={(id) => {
              setSelectedModuleId(id);
              setShowRightInspector(true);
            }}
            onMoveModule={handleMoveModule}
            onDeleteModule={handleDeleteModule}
          />
        </main>

        {/* Right Side Inspector */}
        {showRightInspector && (
          <aside className="w-72 sm:w-80 bg-white border-l border-gray-200 flex-shrink-0 h-full overflow-y-auto z-10 shadow-xs">
            <ModuleInspector
              module={selectedModule}
              onUpdate={handleUpdateModule}
              onDelete={handleDeleteModule}
              onClose={() => setShowRightInspector(false)}
            />
          </aside>
        )}
      </div>

      {/* 3. Bottom Multi-Page Manager */}
      <footer className="no-print">
        <PageManager
          pages={edition.pages}
          activePageIndex={activePageIndex}
          onSelectPage={(idx) => {
            setActivePageIndex(idx);
            setSelectedModuleId(null);
          }}
          onAddPage={handleAddPage}
          onDuplicatePage={handleDuplicatePage}
          onDeletePage={handleDeletePage}
          onMovePage={handleMovePage}
        />
      </footer>
    </div>
  );
}

