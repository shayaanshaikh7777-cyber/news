export type CanvasRatio = "16:9" | "9:16" | "1:1" | "4:5";

export interface CanvasDimensions {
  ratio: CanvasRatio;
  width: number;
  height: number;
  label: string;
  description: string;
}

export const CANVAS_PRESETS: Record<CanvasRatio, CanvasDimensions> = {
  "16:9": {
    ratio: "16:9",
    width: 1920,
    height: 1080,
    label: "१६:९ लँडस्केप (YouTube / Facebook)",
    description: "मानक वृत्त प्रसारण व लांब व्हिडिओसाठी",
  },
  "9:16": {
    ratio: "9:16",
    width: 1080,
    height: 1920,
    label: "९:१६ व्हर्टिकल (Instagram Reels / Shorts)",
    description: "शॉर्ट्स, रील्स आणि मोबाईल कथेसाठी",
  },
  "1:1": {
    ratio: "1:1",
    width: 1080,
    height: 1080,
    label: "१:१ स्क्वेअर (Social Feed / Post)",
    description: "सोशल मीडिया फीड पोस्ट व जाहिरात",
  },
  "4:5": {
    ratio: "4:5",
    width: 1080,
    height: 1350,
    label: "४:५ पोर्ट्रेट (Instagram Portrait)",
    description: "उभ्या फीडमधील आकर्षक वृत्त पोस्ट",
  },
};

export type VideoTrackId = "V1" | "V2" | "V3" | "V4";
export type AudioTrackId = "A1" | "A2" | "A3" | "A4";
export type TrackId = VideoTrackId | AudioTrackId;

export interface TrackMeta {
  id: TrackId;
  type: "video" | "audio";
  label: string;
  description: string;
  isLocked: boolean;
  isHidden: boolean;
  isMuted: boolean;
  isSolo: boolean;
}

export interface VideoClipItem {
  id: string;
  trackId: VideoTrackId;
  assetUrl: string;
  title: string;
  startTime: number; // in seconds
  duration: number; // in seconds
  sourceIn: number; // in seconds
  sourceOut: number; // in seconds
  speed: number; // 0.5 to 2.0
  volume: number; // 0 to 100
  mute: boolean;
  opacity: number; // 0 to 1
  scale: number; // 0.1 to 3.0
  positionX: number; // -100 to 100 percent
  positionY: number; // -100 to 100 percent
  rotation: number; // degrees
  brightness: number; // 50 to 150
  contrast: number; // 50 to 150
  saturation: number; // 50 to 150
  thumbnailUrl?: string;
  mediaType: "video" | "image";
}

export type GraphicType =
  | "lower-third"
  | "location-tag"
  | "breaking-bar"
  | "headline-card"
  | "subheadline-card"
  | "quote-card"
  | "info-box"
  | "live-badge"
  | "exclusive-badge"
  | "running-ticker"
  | "logo-watermark"
  | "caption"
  | "end-screen";

export type NewsFontKey = "tiro-press" | "mukta" | "noto-serif" | "noto-sans";

export interface GraphicOverlayItem {
  id: string;
  trackId: "V3" | "V4";
  type: GraphicType;
  title: string; // Primary text e.g. "नासिर पठाण" or headline
  subtitle?: string; // Secondary text e.g. "विशेष प्रतिनिधी, जामखेड"
  locationText?: string; // e.g. "📍 जामखेड"
  tickerSpeed?: "slow" | "normal" | "fast"; // for running ticker
  startTime: number; // seconds
  duration: number; // seconds
  fontKey: NewsFontKey;
  fontSize: number; // px
  fontWeight: "bold" | "black" | "normal";
  textColor: string;
  bgColor: string;
  accentColor: string;
  positionX: number; // %
  positionY: number; // %
  animation: "fade" | "slide-up" | "slide-down" | "ticker-scroll" | "reveal" | "none";
  opacity: number;
  scale: number;
}

export interface AudioClipItem {
  id: string;
  trackId: AudioTrackId;
  assetUrl: string;
  title: string;
  startTime: number;
  duration: number;
  sourceIn: number;
  sourceOut: number;
  volume: number; // 0 to 100
  mute: boolean;
  fadeInSeconds: number;
  fadeOutSeconds: number;
  sourceType: "main-audio" | "elevenlabs" | "reporter-recording" | "music";
}

export interface AudioMixerTrackConfig {
  trackId: AudioTrackId;
  label: string;
  volume: number; // 0 to 100
  mute: boolean;
  solo: boolean;
  duckingEnabled: boolean;
  duckingAmountPercent: number; // e.g. lower music to 20%
}

export type VideoTemplateId =
  | "breaking-news"
  | "ground-report"
  | "reporter-package"
  | "local-news"
  | "event-coverage"
  | "interview"
  | "photo-news"
  | "exclusive"
  | "live-news"
  | "shorts-reel";

export interface VideoTemplate {
  templateId: VideoTemplateId;
  nameMarathi: string;
  nameEnglish: string;
  description: string;
  canvasRatio: CanvasRatio;
  defaultDurationSeconds: number;
  badge: string;
}

export interface VideoProject {
  id: string;
  title: string;
  description?: string;
  canvasRatio: CanvasRatio;
  width: number;
  height: number;
  fps: number;
  duration: number; // Total timeline duration in seconds
  videoClips: VideoClipItem[];
  graphics: GraphicOverlayItem[];
  audioClips: AudioClipItem[];
  audioMixer: AudioMixerTrackConfig[];
  articleId?: string;
  notes?: string;
  status: "DRAFT" | "READY" | "RENDERED";
  version: number;
  createdAt: string;
  updatedAt: string;
  lastExportUrl?: string;
}

export interface ElevenLabsVoiceOption {
  voiceId: string;
  name: string;
  gender: "male" | "female";
  languageNote: string;
  previewAudioUrl?: string;
}

export interface RenderJobStatus {
  id: string;
  projectId: string;
  status: "QUEUED" | "RENDERING" | "COMPLETED" | "FAILED";
  progressPercent: number;
  downloadUrl?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}
