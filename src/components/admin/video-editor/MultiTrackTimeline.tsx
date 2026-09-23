"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  VideoTrackId,
  AudioTrackId,
  TrackId,
  VideoClipItem,
  GraphicOverlayItem,
  AudioClipItem,
  AudioMixerTrackConfig,
} from "@/types/video-studio";
import {
  Play,
  Pause,
  Scissors,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Video,
  Type,
  Mic,
  Music,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";

interface MultiTrackTimelineProps {
  duration: number; // total project duration in seconds
  currentTime: number; // playhead position in seconds
  isPlaying: boolean;
  onSeek: (time: number) => void;
  onTogglePlay: () => void;
  // Clips & Items
  videoClips: VideoClipItem[];
  graphics: GraphicOverlayItem[];
  audioClips: AudioClipItem[];
  audioMixer: AudioMixerTrackConfig[];
  // Selection
  selectedId: string | null;
  selectedType: "clip" | "graphic" | "audio" | null;
  onSelect: (id: string | null, type: "clip" | "graphic" | "audio" | null) => void;
  // Mutations
  onUpdateClip: (id: string, updates: Partial<VideoClipItem>) => void;
  onUpdateGraphic: (id: string, updates: Partial<GraphicOverlayItem>) => void;
  onUpdateAudio: (id: string, updates: Partial<AudioClipItem>) => void;
  onSplitAtPlayhead: () => void;
  onDeleteItem: (id: string, type: "clip" | "graphic" | "audio") => void;
  onUpdateMixerTrack: (trackId: AudioTrackId, updates: Partial<AudioMixerTrackConfig>) => void;
}

export default function MultiTrackTimeline({
  duration,
  currentTime,
  isPlaying,
  onSeek,
  onTogglePlay,
  videoClips,
  graphics,
  audioClips,
  audioMixer,
  selectedId,
  selectedType,
  onSelect,
  onUpdateClip,
  onUpdateGraphic,
  onUpdateAudio,
  onSplitAtPlayhead,
  onDeleteItem,
  onUpdateMixerTrack,
}: MultiTrackTimelineProps) {
  // Pixels per second (zoom factor)
  const [pixelsPerSecond, setPixelsPerSecond] = useState<number>(20);
  const timelineTracksRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [trimmingState, setTrimmingState] = useState<{
    id: string;
    type: "clip" | "graphic" | "audio";
    edge: "start" | "end";
    originalStart: number;
    originalDuration: number;
    startX: number;
  } | null>(null);

  // Track lock and visibility states (client UI)
  const [lockedTracks, setLockedTracks] = useState<Record<string, boolean>>({});
  const [hiddenTracks, setHiddenTracks] = useState<Record<string, boolean>>({});

  const toggleTrackLock = (trackId: string) => {
    setLockedTracks((prev) => ({ ...prev, [trackId]: !prev[trackId] }));
  };

  const toggleTrackVisibility = (trackId: string) => {
    setHiddenTracks((prev) => ({ ...prev, [trackId]: !prev[trackId] }));
  };

  // Timeline width in pixels
  const timelineWidth = Math.max(1200, Math.ceil(duration * pixelsPerSecond) + 200);

  // Timecode formatting helper
  const formatTimecode = (seconds: number) => {
    const s = Math.max(0, seconds);
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const frames = Math.floor((s - Math.floor(s)) * 30);
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}:${frames.toString().padStart(2, "0")}`;
  };

  // Handle click / drag on the ruler or lane to scrub playhead
  const handleTimelineScrub = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!timelineTracksRef.current) return;
      const rect = timelineTracksRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left + timelineTracksRef.current.scrollLeft;
      const newTime = Math.max(0, Math.min(duration, clickX / pixelsPerSecond));
      onSeek(newTime);
    },
    [duration, onSeek, pixelsPerSecond]
  );

  const onMouseDownRuler = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsScrubbing(true);
    handleTimelineScrub(e);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isScrubbing && timelineTracksRef.current) {
        const rect = timelineTracksRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left + timelineTracksRef.current.scrollLeft;
        const newTime = Math.max(0, Math.min(duration, mouseX / pixelsPerSecond));
        onSeek(newTime);
      } else if (trimmingState) {
        const deltaX = e.clientX - trimmingState.startX;
        const deltaSec = deltaX / pixelsPerSecond;

        if (trimmingState.edge === "end") {
          const newDuration = Math.max(0.3, trimmingState.originalDuration + deltaSec);
          if (trimmingState.type === "clip") {
            onUpdateClip(trimmingState.id, { duration: Math.min(duration - trimmingState.originalStart, newDuration) });
          } else if (trimmingState.type === "graphic") {
            onUpdateGraphic(trimmingState.id, { duration: Math.min(duration - trimmingState.originalStart, newDuration) });
          } else if (trimmingState.type === "audio") {
            onUpdateAudio(trimmingState.id, { duration: Math.min(duration - trimmingState.originalStart, newDuration) });
          }
        } else if (trimmingState.edge === "start") {
          const newStart = Math.max(0, trimmingState.originalStart + deltaSec);
          const newDuration = Math.max(0.3, trimmingState.originalDuration - deltaSec);
          if (trimmingState.type === "clip") {
            onUpdateClip(trimmingState.id, { startTime: newStart, duration: newDuration });
          } else if (trimmingState.type === "graphic") {
            onUpdateGraphic(trimmingState.id, { startTime: newStart, duration: newDuration });
          } else if (trimmingState.type === "audio") {
            onUpdateAudio(trimmingState.id, { startTime: newStart, duration: newDuration });
          }
        }
      }
    };

    const onMouseUp = () => {
      if (isScrubbing) setIsScrubbing(false);
      if (trimmingState) setTrimmingState(null);
    };

    if (isScrubbing || trimmingState) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      return () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };
    }
  }, [isScrubbing, trimmingState, duration, pixelsPerSecond, onSeek, onUpdateClip, onUpdateGraphic, onUpdateAudio]);

  // Generate ruler tick marks
  const rulerStepSec = pixelsPerSecond >= 30 ? 1 : pixelsPerSecond >= 15 ? 2 : 5;
  const tickCount = Math.ceil(duration / rulerStepSec);

  return (
    <div className="flex flex-col h-full bg-gray-950 border-t border-gray-800 select-none">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900 border-b border-gray-800 text-xs">
        {/* Playback & Cut Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSeek(0)}
            title="सुरुवातीला जा (Home)"
            className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSeek(Math.max(0, currentTime - 1))}
            title="१ सेकंद मागे (Left Arrow)"
            className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onTogglePlay}
            title="प्ले / पॉज (Space)"
            className={`p-1.5 px-3 rounded font-bold flex items-center gap-1.5 ${
              isPlaying
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-red-700 hover:bg-red-600 text-white"
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? "पॉज" : "प्ले"}</span>
          </button>
          <button
            onClick={() => onSeek(Math.min(duration, currentTime + 1))}
            title="१ सेकंद पुढे (Right Arrow)"
            className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-gray-700 mx-1" />

          {/* Timecode display */}
          <div className="font-mono bg-black/60 px-2 py-1 rounded text-red-400 border border-gray-800 font-bold tracking-wider">
            {formatTimecode(currentTime)}{" "}
            <span className="text-gray-500 font-normal">/ {formatTimecode(duration)}</span>
          </div>

          <div className="h-4 w-px bg-gray-700 mx-1" />

          {/* Split & Delete Actions */}
          <button
            onClick={onSplitAtPlayhead}
            title="प्लेहेडवर कट करा (Split Clip - Shortcut: S)"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-amber-300 font-medium hover:text-white transition"
          >
            <Scissors className="w-3.5 h-3.5 text-amber-400" />
            <span>कट (Split [S])</span>
          </button>

          {selectedId && selectedType && (
            <button
              onClick={() => onDeleteItem(selectedId, selectedType)}
              title="निवडलेला घटक हटवा (Delete / Backspace)"
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-red-950 hover:bg-red-900 text-red-300 font-medium border border-red-800 transition"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>हटवा (Delete)</span>
            </button>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-[11px]">टाइमलाइन झूम:</span>
          <button
            onClick={() => setPixelsPerSecond((p) => Math.max(8, p - 4))}
            title="झूम कमी करा"
            className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <input
            type="range"
            min={8}
            max={60}
            value={pixelsPerSecond}
            onChange={(e) => setPixelsPerSecond(Number(e.target.value))}
            className="w-20 accent-red-600 h-1 bg-gray-700 rounded cursor-pointer"
          />
          <button
            onClick={() => setPixelsPerSecond((p) => Math.min(60, p + 4))}
            title="झूम वाढवा"
            className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setPixelsPerSecond(20)}
            title="डिफॉल्ट झूम"
            className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Track Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Track Headers (Fixed Column) */}
        <div className="w-48 bg-gray-900 border-r border-gray-800 flex-shrink-0 flex flex-col z-20">
          {/* Ruler placeholder header */}
          <div className="h-7 bg-gray-950 border-b border-gray-800 px-3 flex items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            ट्रॅक व्यवस्थापन
          </div>

          {/* Video Track Headers */}
          <div className="flex flex-col">
            {/* V4 Logo */}
            <TrackHeaderRow
              trackId="V4"
              title="V4: लोगो व वॉटरमार्क"
              icon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
              isLocked={!!lockedTracks["V4"]}
              isHidden={!!hiddenTracks["V4"]}
              onToggleLock={() => toggleTrackLock("V4")}
              onToggleHide={() => toggleTrackVisibility("V4")}
            />
            {/* V3 Graphics */}
            <TrackHeaderRow
              trackId="V3"
              title="V3: ग्राफिक व टिकर"
              icon={<Type className="w-3.5 h-3.5 text-purple-400" />}
              isLocked={!!lockedTracks["V3"]}
              isHidden={!!hiddenTracks["V3"]}
              onToggleLock={() => toggleTrackLock("V3")}
              onToggleHide={() => toggleTrackVisibility("V3")}
            />
            {/* V2 Overlay / B-Roll */}
            <TrackHeaderRow
              trackId="V2"
              title="V2: बी-रोल व ओव्हरले"
              icon={<Video className="w-3.5 h-3.5 text-orange-400" />}
              isLocked={!!lockedTracks["V2"]}
              isHidden={!!hiddenTracks["V2"]}
              onToggleLock={() => toggleTrackLock("V2")}
              onToggleHide={() => toggleTrackVisibility("V2")}
            />
            {/* V1 Main Footage */}
            <TrackHeaderRow
              trackId="V1"
              title="V1: मुख्य व्हिडिओ दृश्य"
              icon={<Video className="w-3.5 h-3.5 text-red-400" />}
              isLocked={!!lockedTracks["V1"]}
              isHidden={!!hiddenTracks["V1"]}
              onToggleLock={() => toggleTrackLock("V1")}
              onToggleHide={() => toggleTrackVisibility("V1")}
            />
          </div>

          {/* Audio Track Headers Divider */}
          <div className="h-4 bg-gray-950 border-y border-gray-800 px-3 flex items-center text-[9px] text-gray-400 uppercase font-semibold">
            ऑडिओ ट्रॅक्स
          </div>

          {/* Audio Track Headers */}
          <div className="flex flex-col">
            {/* A1 Main Audio */}
            <AudioTrackHeaderRow
              trackId="A1"
              title="A1: मुख्य व्हिडिओ आवाज"
              icon={<Volume2 className="w-3.5 h-3.5 text-blue-400" />}
              mixer={audioMixer.find((m) => m.trackId === "A1")}
              onUpdateMixer={onUpdateMixerTrack}
            />
            {/* A2 ElevenLabs AI */}
            <AudioTrackHeaderRow
              trackId="A2"
              title="A2: ElevenLabs AI व्हॉईस"
              icon={<Sparkles className="w-3.5 h-3.5 text-green-400" />}
              mixer={audioMixer.find((m) => m.trackId === "A2")}
              onUpdateMixer={onUpdateMixerTrack}
            />
            {/* A3 Reporter Mic */}
            <AudioTrackHeaderRow
              trackId="A3"
              title="A3: रिपोर्टर माईक रेकॉर्ड"
              icon={<Mic className="w-3.5 h-3.5 text-teal-400" />}
              mixer={audioMixer.find((m) => m.trackId === "A3")}
              onUpdateMixer={onUpdateMixerTrack}
            />
            {/* A4 Background Music */}
            <AudioTrackHeaderRow
              trackId="A4"
              title="A4: पार्श्वसंगीत (डकिंगसह)"
              icon={<Music className="w-3.5 h-3.5 text-indigo-400" />}
              mixer={audioMixer.find((m) => m.trackId === "A4")}
              onUpdateMixer={onUpdateMixerTrack}
            />
          </div>
        </div>

        {/* Right Scrollable Timeline Container */}
        <div
          ref={timelineTracksRef}
          className="flex-1 overflow-x-auto overflow-y-auto relative bg-gray-950"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              onSelect(null, null);
            }
          }}
        >
          {/* Scroller Canvas Container */}
          <div style={{ width: `${timelineWidth}px` }} className="relative flex flex-col min-h-full">
            {/* 1. Timecode Ruler */}
            <div
              className="h-7 bg-gray-900 border-b border-gray-800 relative cursor-pointer select-none"
              onMouseDown={onMouseDownRuler}
            >
              {Array.from({ length: tickCount + 1 }).map((_, i) => {
                const sec = i * rulerStepSec;
                if (sec > duration) return null;
                const leftPos = sec * pixelsPerSecond;
                const isMajor = sec % 5 === 0;

                return (
                  <div
                    key={sec}
                    className="absolute top-0 bottom-0 pointer-events-none flex flex-col justify-end"
                    style={{ left: `${leftPos}px` }}
                  >
                    <span
                      className={`text-[9px] font-mono select-none px-1 ${
                        isMajor ? "text-gray-300 font-semibold" : "text-gray-600"
                      }`}
                    >
                      {formatTimecode(sec).slice(3)}
                    </span>
                    <div className={`w-px ${isMajor ? "h-3 bg-gray-500" : "h-1.5 bg-gray-700"}`} />
                  </div>
                );
              })}
            </div>

            {/* 2. Red Playhead Vertical Needle */}
            <div
              className="absolute top-0 bottom-0 z-30 pointer-events-none"
              style={{ left: `${currentTime * pixelsPerSecond}px` }}
            >
              {/* Playhead Flag / Handle */}
              <div className="relative -left-2 w-4 h-5 bg-red-600 flex items-center justify-center rounded-sm shadow-md pointer-events-auto cursor-ew-resize">
                <div className="w-1 h-2 bg-white rounded-full" />
              </div>
              {/* Red Line */}
              <div className="w-0.5 h-full bg-red-500 shadow-sm shadow-red-500/50" />
            </div>

            {/* 3. Track Lanes */}
            <div className="flex flex-col divide-y divide-gray-900">
              {/* V4 Logo Lane */}
              <TrackLane
                trackId="V4"
                items={graphics.filter((g) => g.trackId === "V4")}
                type="graphic"
                pixelsPerSecond={pixelsPerSecond}
                selectedId={selectedId}
                onSelect={(id) => onSelect(id, "graphic")}
                onStartTrim={(id, edge, origStart, origDur, startX) =>
                  setTrimmingState({ id, type: "graphic", edge, originalStart: origStart, originalDuration: origDur, startX })
                }
                colorClass="bg-amber-800/80 border-amber-600 text-amber-100"
              />

              {/* V3 Graphics Lane */}
              <TrackLane
                trackId="V3"
                items={graphics.filter((g) => g.trackId === "V3")}
                type="graphic"
                pixelsPerSecond={pixelsPerSecond}
                selectedId={selectedId}
                onSelect={(id) => onSelect(id, "graphic")}
                onStartTrim={(id, edge, origStart, origDur, startX) =>
                  setTrimmingState({ id, type: "graphic", edge, originalStart: origStart, originalDuration: origDur, startX })
                }
                colorClass="bg-purple-800/80 border-purple-600 text-purple-100"
              />

              {/* V2 Overlay / B-Roll Lane */}
              <TrackLane
                trackId="V2"
                items={videoClips.filter((c) => c.trackId === "V2")}
                type="clip"
                pixelsPerSecond={pixelsPerSecond}
                selectedId={selectedId}
                onSelect={(id) => onSelect(id, "clip")}
                onStartTrim={(id, edge, origStart, origDur, startX) =>
                  setTrimmingState({ id, type: "clip", edge, originalStart: origStart, originalDuration: origDur, startX })
                }
                colorClass="bg-orange-800/80 border-orange-600 text-orange-100"
              />

              {/* V1 Main Footage Lane */}
              <TrackLane
                trackId="V1"
                items={videoClips.filter((c) => c.trackId === "V1")}
                type="clip"
                pixelsPerSecond={pixelsPerSecond}
                selectedId={selectedId}
                onSelect={(id) => onSelect(id, "clip")}
                onStartTrim={(id, edge, origStart, origDur, startX) =>
                  setTrimmingState({ id, type: "clip", edge, originalStart: origStart, originalDuration: origDur, startX })
                }
                colorClass="bg-red-800/80 border-red-600 text-red-100"
              />

              {/* Audio divider spacer */}
              <div className="h-4 bg-gray-950/80 pointer-events-none" />

              {/* A1 Main Audio Lane */}
              <TrackLane
                trackId="A1"
                items={audioClips.filter((a) => a.trackId === "A1")}
                type="audio"
                pixelsPerSecond={pixelsPerSecond}
                selectedId={selectedId}
                onSelect={(id) => onSelect(id, "audio")}
                onStartTrim={(id, edge, origStart, origDur, startX) =>
                  setTrimmingState({ id, type: "audio", edge, originalStart: origStart, originalDuration: origDur, startX })
                }
                colorClass="bg-blue-800/80 border-blue-600 text-blue-100"
              />

              {/* A2 ElevenLabs Lane */}
              <TrackLane
                trackId="A2"
                items={audioClips.filter((a) => a.trackId === "A2")}
                type="audio"
                pixelsPerSecond={pixelsPerSecond}
                selectedId={selectedId}
                onSelect={(id) => onSelect(id, "audio")}
                onStartTrim={(id, edge, origStart, origDur, startX) =>
                  setTrimmingState({ id, type: "audio", edge, originalStart: origStart, originalDuration: origDur, startX })
                }
                colorClass="bg-emerald-800/80 border-emerald-600 text-emerald-100"
              />

              {/* A3 Mic Lane */}
              <TrackLane
                trackId="A3"
                items={audioClips.filter((a) => a.trackId === "A3")}
                type="audio"
                pixelsPerSecond={pixelsPerSecond}
                selectedId={selectedId}
                onSelect={(id) => onSelect(id, "audio")}
                onStartTrim={(id, edge, origStart, origDur, startX) =>
                  setTrimmingState({ id, type: "audio", edge, originalStart: origStart, originalDuration: origDur, startX })
                }
                colorClass="bg-teal-800/80 border-teal-600 text-teal-100"
              />

              {/* A4 Music Lane */}
              <TrackLane
                trackId="A4"
                items={audioClips.filter((a) => a.trackId === "A4")}
                type="audio"
                pixelsPerSecond={pixelsPerSecond}
                selectedId={selectedId}
                onSelect={(id) => onSelect(id, "audio")}
                onStartTrim={(id, edge, origStart, origDur, startX) =>
                  setTrimmingState({ id, type: "audio", edge, originalStart: origStart, originalDuration: origDur, startX })
                }
                colorClass="bg-indigo-800/80 border-indigo-600 text-indigo-100"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Sub-Components
// -------------------------------------------------------------

function TrackHeaderRow({
  trackId,
  title,
  icon,
  isLocked,
  isHidden,
  onToggleLock,
  onToggleHide,
}: {
  trackId: string;
  title: string;
  icon: React.ReactNode;
  isLocked: boolean;
  isHidden: boolean;
  onToggleLock: () => void;
  onToggleHide: () => void;
}) {
  return (
    <div className="h-10 px-2 flex items-center justify-between border-b border-gray-800/60 hover:bg-gray-850 text-xs">
      <div className="flex items-center gap-1.5 overflow-hidden">
        {icon}
        <span className="font-semibold text-gray-200 truncate text-[11px]">{title}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleLock}
          className={`p-1 rounded ${isLocked ? "text-amber-400 bg-amber-950" : "text-gray-500 hover:text-gray-300"}`}
          title={isLocked ? "ट्रॅक अनलॉक करा" : "ट्रॅक लॉक करा"}
        >
          {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
        </button>
        <button
          onClick={onToggleHide}
          className={`p-1 rounded ${isHidden ? "text-red-400 bg-red-950" : "text-gray-500 hover:text-gray-300"}`}
          title={isHidden ? "ट्रॅक दाखवा" : "ट्रॅक लपवा"}
        >
          {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
        </button>
      </div>
    </div>
  );
}

function AudioTrackHeaderRow({
  trackId,
  title,
  icon,
  mixer,
  onUpdateMixer,
}: {
  trackId: AudioTrackId;
  title: string;
  icon: React.ReactNode;
  mixer?: AudioMixerTrackConfig;
  onUpdateMixer: (trackId: AudioTrackId, updates: Partial<AudioMixerTrackConfig>) => void;
}) {
  const isMuted = mixer ? mixer.mute : false;
  const volume = mixer ? mixer.volume : 100;

  return (
    <div className="h-10 px-2 flex items-center justify-between border-b border-gray-800/60 hover:bg-gray-850 text-xs">
      <div className="flex items-center gap-1.5 overflow-hidden">
        {icon}
        <span className="font-semibold text-gray-200 truncate text-[11px]">{title}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onUpdateMixer(trackId, { mute: !isMuted })}
          className={`p-1 rounded ${isMuted ? "text-red-400 bg-red-950" : "text-gray-400 hover:text-white"}`}
          title={isMuted ? "आवाज चालू करा" : "आवाज बंद करा (Mute)"}
        >
          {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={isMuted ? 0 : volume}
          onChange={(e) => onUpdateMixer(trackId, { volume: Number(e.target.value), mute: false })}
          className="w-12 h-1 accent-blue-500 bg-gray-700 rounded cursor-pointer"
          title={`आवाज: ${volume}%`}
        />
      </div>
    </div>
  );
}

function TrackLane({
  trackId,
  items,
  type,
  pixelsPerSecond,
  selectedId,
  onSelect,
  onStartTrim,
  colorClass,
}: {
  trackId: string;
  items: Array<VideoClipItem | GraphicOverlayItem | AudioClipItem>;
  type: "clip" | "graphic" | "audio";
  pixelsPerSecond: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onStartTrim: (id: string, edge: "start" | "end", origStart: number, origDur: number, startX: number) => void;
  colorClass: string;
}) {
  return (
    <div className="h-10 relative bg-gray-900/40 hover:bg-gray-900/60 transition-colors">
      {items.map((item) => {
        const left = item.startTime * pixelsPerSecond;
        const width = Math.max(16, item.duration * pixelsPerSecond);
        const isSelected = selectedId === item.id;

        return (
          <div
            key={item.id}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(item.id);
            }}
            style={{ left: `${left}px`, width: `${width}px` }}
            className={`absolute top-1 bottom-1 rounded border flex items-center px-1.5 overflow-hidden text-[10px] cursor-pointer group shadow-sm transition-all ${colorClass} ${
              isSelected ? "ring-2 ring-yellow-400 border-white z-10 brightness-110 shadow-lg" : "hover:brightness-105"
            }`}
          >
            {/* Left Trim Handle */}
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                onStartTrim(item.id, "start", item.startTime, item.duration, e.clientX);
              }}
              className="absolute left-0 top-0 bottom-0 w-2 hover:w-3 bg-white/20 hover:bg-white/70 cursor-w-resize transition-all rounded-l"
              title="सुरुवात ट्रिम करा"
            />

            {/* Label Content */}
            <div className="flex-1 truncate px-1 font-medium select-none pointer-events-none">
              {item.title}
            </div>

            {/* Right Trim Handle */}
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                onStartTrim(item.id, "end", item.startTime, item.duration, e.clientX);
              }}
              className="absolute right-0 top-0 bottom-0 w-2 hover:w-3 bg-white/20 hover:bg-white/70 cursor-e-resize transition-all rounded-r"
              title="शेवट ट्रिम करा"
            />
          </div>
        );
      })}
    </div>
  );
}
