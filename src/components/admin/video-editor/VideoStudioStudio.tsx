"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  VideoProject,
  CanvasRatio,
  CANVAS_PRESETS,
  VideoClipItem,
  GraphicOverlayItem,
  AudioClipItem,
  AudioMixerTrackConfig,
  VideoTemplateId,
  AudioTrackId,
} from "@/types/video-studio";
import { createProjectFromTemplate } from "@/lib/video-editor/templates";
import { renderProjectToVideoFile } from "@/lib/video-editor/client-render";
import {
  saveVideoProjectAction,
  createVideoScriptFromArticleAction,
} from "@/actions/video-project.actions";
import { StudioTopBar } from "./StudioTopBar";
import { SourceMonitor } from "./SourceMonitor";
import { ProgramMonitor } from "./ProgramMonitor";
import MultiTrackTimeline from "./MultiTrackTimeline";
import AssetLibraryPanel from "./AssetLibraryPanel";
import InspectorPanel from "./InspectorPanel";
import {
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
} from "lucide-react";

interface PublishedArticleMeta {
  id: string;
  title: string;
  excerpt?: string;
  featuredImage?: string | null;
  categoryName?: string;
  authorName?: string;
}

interface VideoStudioStudioProps {
  initialProject?: VideoProject;
  articles: PublishedArticleMeta[];
}

export default function VideoStudioStudio({
  initialProject,
  articles,
}: VideoStudioStudioProps) {
  // Initialize project from initial or default template
  const [project, setProject] = useState<VideoProject>(() => {
    return initialProject || createProjectFromTemplate("ground-report", "आवाज जामखेडचा - नवीन वृत्त व्हिडिओ");
  });

  // History stack for Undo / Redo
  const [history, setHistory] = useState<VideoProject[]>([project]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Monitors & Layout state
  const [isDualMonitor, setIsDualMonitor] = useState<boolean>(true);
  const [showSafeZones, setShowSafeZones] = useState<boolean>(false);

  // Playhead & Playback state
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const playbackTimerRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Selection state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<"clip" | "graphic" | "audio" | null>(null);

  // Source Monitor Media preview state
  const [sourceMedia, setSourceMedia] = useState<{ url: string; title: string } | null>(null);

  // Saving state
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>("");

  // Export Modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportStatusText, setExportStatusText] = useState<string>("");
  const [exportDownloadUrl, setExportDownloadUrl] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Helper to commit state with history tracking
  const pushState = useCallback((newProject: VideoProject) => {
    setProject(newProject);
    setHistory((prev) => {
      const next = prev.slice(0, historyIndex + 1);
      next.push(newProject);
      if (next.length > 30) next.shift(); // keep max 30
      return next;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 29));
  }, [historyIndex]);

  // Undo / Redo
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    const newIdx = historyIndex - 1;
    setHistoryIndex(newIdx);
    setProject(history[newIdx]);
  }, [canUndo, historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    const newIdx = historyIndex + 1;
    setHistoryIndex(newIdx);
    setProject(history[newIdx]);
  }, [canRedo, historyIndex, history]);

  // Playback Loop
  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();

      const tick = () => {
        const now = performance.now();
        const deltaSec = (now - (lastTimeRef.current || now)) / 1000;
        lastTimeRef.current = now;

        setCurrentTime((prev) => {
          const next = prev + deltaSec;
          if (next >= project.duration) {
            setIsPlaying(false);
            return 0; // loop back or stop
          }
          return next;
        });

        playbackTimerRef.current = requestAnimationFrame(tick);
      };

      playbackTimerRef.current = requestAnimationFrame(tick);
    } else {
      if (playbackTimerRef.current) {
        cancelAnimationFrame(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
      lastTimeRef.current = null;
    }

    return () => {
      if (playbackTimerRef.current) cancelAnimationFrame(playbackTimerRef.current);
    };
  }, [isPlaying, project.duration]);

  // Save Project Action
  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage("प्रकल्प जतन होत आहे...");
    try {
      const res = await saveVideoProjectAction(project);
      if (res.success) {
        setSaveMessage("प्रकल्प यशस्वीरित्या सेव्ह झाला!");
        setTimeout(() => setSaveMessage(""), 3000);
      } else {
        setSaveMessage(`त्रुटी: ${res.error}`);
      }
    } catch (err: unknown) {
      setSaveMessage(`त्रुटी: ${(err as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Export Video Handler
  const handleStartExport = async () => {
    setIsExportModalOpen(true);
    setIsExporting(true);
    setExportProgress(0);
    setExportStatusText("व्हिडिओ रेंडरिंग सुरू करत आहे...");
    setExportDownloadUrl(null);
    setExportError(null);

    try {
      const blob = await renderProjectToVideoFile(project, (percent, status) => {
        setExportProgress(percent);
        setExportStatusText(status);
      });

      const url = URL.createObjectURL(blob);
      setExportDownloadUrl(url);
      setExportProgress(100);
      setExportStatusText("व्हिडिओ यशस्वीरित्या तयार झाला!");
    } catch (err: unknown) {
      setExportError((err as Error).message || "व्हिडिओ रेंडर करताना त्रुटी आली.");
    } finally {
      setIsExporting(false);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return; // Don't intercept when typing in form fields
      }

      if (e.code === "Space") {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        handleSplitAtPlayhead();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId && selectedType) {
          e.preventDefault();
          handleDeleteItem(selectedId, selectedType);
        }
      } else if (e.key === "Home") {
        e.preventDefault();
        setCurrentTime(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setCurrentTime(project.duration);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentTime((prev) => Math.max(0, prev - (e.shiftKey ? 1 : 0.033)));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setCurrentTime((prev) => Math.min(project.duration, prev + (e.shiftKey ? 1 : 0.033)));
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isPlaying,
    selectedId,
    selectedType,
    project.duration,
    handleUndo,
    handleRedo,
  ]);

  // Mutations: Split clip at playhead
  const handleSplitAtPlayhead = () => {
    // 1. Check if a video clip on V1 or V2 is under playhead
    const targetClipIndex = project.videoClips.findIndex(
      (c) => currentTime > c.startTime && currentTime < c.startTime + c.duration
    );

    if (targetClipIndex !== -1) {
      const orig = project.videoClips[targetClipIndex];
      const firstDuration = currentTime - orig.startTime;
      const secondDuration = orig.duration - firstDuration;

      const firstPart: VideoClipItem = {
        ...orig,
        duration: firstDuration,
        sourceOut: orig.sourceIn + firstDuration,
      };

      const secondPart: VideoClipItem = {
        ...orig,
        id: `clip_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        startTime: currentTime,
        duration: secondDuration,
        sourceIn: orig.sourceIn + firstDuration,
        title: `${orig.title} (Part 2)`,
      };

      const nextClips = [...project.videoClips];
      nextClips.splice(targetClipIndex, 1, firstPart, secondPart);

      pushState({ ...project, videoClips: nextClips, updatedAt: new Date().toISOString() });
      return;
    }

    // 2. Check if an audio clip is under playhead
    const targetAudioIndex = project.audioClips.findIndex(
      (a) => currentTime > a.startTime && currentTime < a.startTime + a.duration
    );

    if (targetAudioIndex !== -1) {
      const orig = project.audioClips[targetAudioIndex];
      const firstDuration = currentTime - orig.startTime;
      const secondDuration = orig.duration - firstDuration;

      const firstPart: AudioClipItem = {
        ...orig,
        duration: firstDuration,
        sourceOut: orig.sourceIn + firstDuration,
      };

      const secondPart: AudioClipItem = {
        ...orig,
        id: `audio_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        startTime: currentTime,
        duration: secondDuration,
        sourceIn: orig.sourceIn + firstDuration,
        title: `${orig.title} (Part 2)`,
      };

      const nextAudios = [...project.audioClips];
      nextAudios.splice(targetAudioIndex, 1, firstPart, secondPart);

      pushState({ ...project, audioClips: nextAudios, updatedAt: new Date().toISOString() });
    }
  };

  // Delete item
  const handleDeleteItem = (id: string, type: "clip" | "graphic" | "audio") => {
    if (type === "clip") {
      pushState({
        ...project,
        videoClips: project.videoClips.filter((c) => c.id !== id),
        updatedAt: new Date().toISOString(),
      });
    } else if (type === "graphic") {
      pushState({
        ...project,
        graphics: project.graphics.filter((g) => g.id !== id),
        updatedAt: new Date().toISOString(),
      });
    } else if (type === "audio") {
      pushState({
        ...project,
        audioClips: project.audioClips.filter((a) => a.id !== id),
        updatedAt: new Date().toISOString(),
      });
    }
    if (selectedId === id) {
      setSelectedId(null);
      setSelectedType(null);
    }
  };

  // Add clip
  const handleAddClip = (clipData: Omit<VideoClipItem, "id">) => {
    const newClip: VideoClipItem = {
      ...clipData,
      id: `clip_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };
    pushState({
      ...project,
      videoClips: [...project.videoClips, newClip],
      updatedAt: new Date().toISOString(),
    });
  };

  // Add graphic
  const handleAddGraphic = (graphicData: Omit<GraphicOverlayItem, "id">) => {
    const newGraphic: GraphicOverlayItem = {
      ...graphicData,
      id: `g_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };
    pushState({
      ...project,
      graphics: [...project.graphics, newGraphic],
      updatedAt: new Date().toISOString(),
    });
  };

  // Add audio
  const handleAddAudio = (audioData: Omit<AudioClipItem, "id">) => {
    const newAudio: AudioClipItem = {
      ...audioData,
      id: `a_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };
    pushState({
      ...project,
      audioClips: [...project.audioClips, newAudio],
      updatedAt: new Date().toISOString(),
    });
  };

  // Update clip
  const handleUpdateClip = (id: string, updates: Partial<VideoClipItem>) => {
    pushState({
      ...project,
      videoClips: project.videoClips.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      updatedAt: new Date().toISOString(),
    });
  };

  // Update graphic
  const handleUpdateGraphic = (id: string, updates: Partial<GraphicOverlayItem>) => {
    pushState({
      ...project,
      graphics: project.graphics.map((g) => (g.id === id ? { ...g, ...updates } : g)),
      updatedAt: new Date().toISOString(),
    });
  };

  // Update audio
  const handleUpdateAudio = (id: string, updates: Partial<AudioClipItem>) => {
    pushState({
      ...project,
      audioClips: project.audioClips.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      updatedAt: new Date().toISOString(),
    });
  };

  // Update mixer track
  const handleUpdateMixerTrack = (trackId: AudioTrackId, updates: Partial<AudioMixerTrackConfig>) => {
    pushState({
      ...project,
      audioMixer: project.audioMixer.map((m) => (m.trackId === trackId ? { ...m, ...updates } : m)),
      updatedAt: new Date().toISOString(),
    });
  };

  // Change canvas ratio
  const handleChangeRatio = (ratio: CanvasRatio) => {
    const preset = CANVAS_PRESETS[ratio];
    pushState({
      ...project,
      canvasRatio: ratio,
      width: preset.width,
      height: preset.height,
      updatedAt: new Date().toISOString(),
    });
  };

  // Apply template
  const handleApplyTemplate = (templateId: VideoTemplateId) => {
    const newProj = createProjectFromTemplate(templateId, project.title);
    pushState(newProj);
    setCurrentTime(0);
    setSelectedId(null);
    setSelectedType(null);
  };

  // Generate timeline from article
  const handleGenerateFromArticle = async (articleId: string) => {
    try {
      const res = await createVideoScriptFromArticleAction(articleId);
      if (res.success && res.articleMeta) {
        const newProj = createProjectFromTemplate(
          "ground-report",
          res.articleMeta.headline || project.title,
          {
            headline: res.articleMeta.headline,
            location: res.articleMeta.location,
            reporterName: res.articleMeta.reporterName,
            articleId,
            imageUrl: res.articleMeta.imageUrl,
          }
        );

        if (res.script?.fullScript) {
          newProj.notes = res.script.fullScript;
        }

        if (res.articleMeta.imageUrl) {
          newProj.videoClips.push({
            id: `clip_${Date.now()}_img`,
            trackId: "V1",
            assetUrl: res.articleMeta.imageUrl,
            title: res.articleMeta.headline || "बातमी छायाचित्र",
            startTime: 0,
            duration: newProj.duration,
            sourceIn: 0,
            sourceOut: newProj.duration,
            speed: 1,
            volume: 0,
            mute: true,
            opacity: 1,
            scale: 1,
            positionX: 0,
            positionY: 0,
            rotation: 0,
            brightness: 100,
            contrast: 100,
            saturation: 100,
            mediaType: "image",
          });
        }

        pushState(newProj);
        setCurrentTime(0);
        setSelectedId(null);
        setSelectedType(null);
      } else {
        alert(res.error || "बातम्यातून व्हिडिओ तयार करताना त्रुटी आली.");
      }
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  // Selected item lookup
  const selectedClip = selectedType === "clip" ? project.videoClips.find((c) => c.id === selectedId) : undefined;
  const selectedGraphic = selectedType === "graphic" ? project.graphics.find((g) => g.id === selectedId) : undefined;
  const selectedAudio = selectedType === "audio" ? project.audioClips.find((a) => a.id === selectedId) : undefined;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-950 select-none overflow-hidden font-sans">
      {/* 1. TOP BAR */}
      <StudioTopBar
        projectTitle={project.title}
        onChangeTitle={(title) => pushState({ ...project, title })}
        canvasRatio={project.canvasRatio}
        onChangeRatio={handleChangeRatio}
        isDualMonitor={isDualMonitor}
        onToggleDualMonitor={() => setIsDualMonitor((prev) => !prev)}
        showSafeZones={showSafeZones}
        onToggleSafeZones={() => setShowSafeZones((prev) => !prev)}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={handleSave}
        isSaving={isSaving}
        saveMessage={saveMessage}
        onExport={handleStartExport}
        isExporting={isExporting}
      />

      {/* 2. MAIN WORKSPACE (Asset Library + Monitors + Inspector) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Asset Library Drawer */}
        <div className="w-80 flex-shrink-0 h-full">
          <AssetLibraryPanel
            articles={articles}
            currentTime={currentTime}
            onAddClip={handleAddClip}
            onAddGraphic={handleAddGraphic}
            onAddAudio={handleAddAudio}
            onPreviewInSource={(url, title) => setSourceMedia({ url, title })}
            onApplyTemplate={handleApplyTemplate}
            onGenerateFromArticle={handleGenerateFromArticle}
          />
        </div>

        {/* Center: Monitors (Source + Program) */}
        <div className="flex-1 flex flex-col min-w-0 bg-black overflow-hidden">
          <div className="flex-1 flex p-2 gap-2 overflow-hidden justify-center items-center">
            {/* Source Monitor (Left - when dual monitor enabled) */}
            {isDualMonitor && (
              <div className="flex-1 h-full max-w-[50%] min-w-0">
                <SourceMonitor
                  assetUrl={sourceMedia?.url}
                  assetTitle={sourceMedia?.title}
                  onInsertToTimeline={(inPoint, outPoint) => {
                    if (sourceMedia) {
                      const dur = Math.max(1, outPoint - inPoint);
                      handleAddClip({
                        trackId: "V1",
                        assetUrl: sourceMedia.url,
                        title: sourceMedia.title,
                        startTime: currentTime,
                        duration: dur,
                        sourceIn: inPoint,
                        sourceOut: outPoint,
                        speed: 1,
                        volume: 100,
                        mute: false,
                        opacity: 1,
                        scale: 1,
                        positionX: 0,
                        positionY: 0,
                        rotation: 0,
                        brightness: 100,
                        contrast: 100,
                        saturation: 100,
                        mediaType: "video",
                      });
                    }
                  }}
                />
              </div>
            )}

            {/* Program Monitor (Right / Main) */}
            <div className="flex-1 h-full min-w-0 flex items-center justify-center">
              <ProgramMonitor
                canvasRatio={project.canvasRatio}
                currentTime={currentTime}
                duration={project.duration}
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying((p) => !p)}
                onSeek={setCurrentTime}
                videoClips={project.videoClips}
                graphics={project.graphics}
                showSafeZones={showSafeZones}
                selectedGraphicId={selectedType === "graphic" ? selectedId : null}
                onSelectGraphic={(id) => {
                  setSelectedId(id);
                  setSelectedType("graphic");
                }}
              />
            </div>
          </div>
        </div>

        {/* Right: Property Inspector Panel */}
        <InspectorPanel
          selectedId={selectedId}
          selectedType={selectedType}
          selectedClip={selectedClip}
          selectedGraphic={selectedGraphic}
          selectedAudio={selectedAudio}
          projectTitle={project.title}
          projectRatio={project.canvasRatio}
          projectDuration={project.duration}
          onUpdateTitle={(title) => pushState({ ...project, title })}
          onUpdateRatio={handleChangeRatio}
          onUpdateDuration={(duration) => pushState({ ...project, duration })}
          onUpdateClip={handleUpdateClip}
          onUpdateGraphic={handleUpdateGraphic}
          onUpdateAudio={handleUpdateAudio}
          onDeleteItem={handleDeleteItem}
        />
      </div>

      {/* 3. MULTI-TRACK TIMELINE (Bottom Section) */}
      <div className="h-64 flex-shrink-0">
        <MultiTrackTimeline
          duration={project.duration}
          currentTime={currentTime}
          isPlaying={isPlaying}
          onSeek={setCurrentTime}
          onTogglePlay={() => setIsPlaying((p) => !p)}
          videoClips={project.videoClips}
          graphics={project.graphics}
          audioClips={project.audioClips}
          audioMixer={project.audioMixer}
          selectedId={selectedId}
          selectedType={selectedType}
          onSelect={(id, type) => {
            setSelectedId(id);
            setSelectedType(type);
          }}
          onUpdateClip={handleUpdateClip}
          onUpdateGraphic={handleUpdateGraphic}
          onUpdateAudio={handleUpdateAudio}
          onSplitAtPlayhead={handleSplitAtPlayhead}
          onDeleteItem={handleDeleteItem}
          onUpdateMixerTrack={handleUpdateMixerTrack}
        />
      </div>

      {/* 4. EXPORT PROGRESS MODAL */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <span className="font-bold text-gray-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-red-500" />
                व्हिडिओ एक्सपोर्ट (Export Video)
              </span>
              {!isExporting && (
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="p-1 rounded text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300">{exportStatusText}</span>
                <span className="font-mono text-red-400 font-bold">{exportProgress}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-red-600 to-amber-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>

              {exportError && (
                <div className="p-3 bg-red-950 border border-red-800 rounded text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{exportError}</span>
                </div>
              )}

              {exportDownloadUrl && (
                <div className="p-3 bg-emerald-950 border border-emerald-800 rounded space-y-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>व्हिडिओ यशस्वीरित्या तयार झाला!</span>
                  </div>
                  <a
                    href={exportDownloadUrl}
                    download={`${project.title.replace(/\s+/g, "_")}.webm`}
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition shadow-lg text-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>व्हिडिओ डाउनलोड करा (Download Video)</span>
                  </a>
                </div>
              )}
            </div>

            {!isExporting && !exportDownloadUrl && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded"
                >
                  बंद करा
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
