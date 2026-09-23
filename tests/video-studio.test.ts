import { describe, it, expect } from "vitest";
import {
  VIDEO_TEMPLATES,
  createProjectFromTemplate,
  DEFAULT_AUDIO_MIXER,
} from "../src/lib/video-editor/templates";
import {
  CANVAS_PRESETS,
  VideoTemplateId,
  CanvasRatio,
} from "../src/types/video-studio";
import {
  GRAPHIC_TYPE_DEFINITIONS,
  NEWS_GRAPHIC_FONTS,
} from "../src/lib/video-editor/graphics";
import { buildFfmpegFilterComplex } from "../src/lib/video-editor/ffmpeg";
import { DEFAULT_ELEVENLABS_VOICES } from "../src/lib/video-editor/elevenlabs";

describe("Professional News Video Studio Unit Tests", () => {
  describe("1. Video Templates Registry", () => {
    it("provides all 10 required professional news video templates", () => {
      const requiredTemplates: VideoTemplateId[] = [
        "breaking-news",
        "ground-report",
        "reporter-package",
        "local-news",
        "event-coverage",
        "interview",
        "photo-news",
        "exclusive",
        "live-news",
        "shorts-reel",
      ];

      expect(Object.keys(VIDEO_TEMPLATES).length).toBe(10);

      requiredTemplates.forEach((tId) => {
        const tmpl = VIDEO_TEMPLATES[tId];
        expect(tmpl).toBeDefined();
        expect(tmpl.nameMarathi).toBeTruthy();
        expect(tmpl.nameEnglish).toBeTruthy();
        expect(tmpl.description).toBeTruthy();
        expect(tmpl.defaultDurationSeconds).toBeGreaterThan(0);
        expect(["16:9", "9:16", "1:1", "4:5"]).toContain(tmpl.canvasRatio);
      });
    });

    it("shorts-reel defaults to 9:16 vertical ratio for mobile reels and shorts", () => {
      expect(VIDEO_TEMPLATES["shorts-reel"].canvasRatio).toBe("9:16");
    });
  });

  describe("2. Canvas Presets & Dimensions", () => {
    it("defines standard broadcast dimensions for 16:9, 9:16, 1:1, and 4:5", () => {
      expect(CANVAS_PRESETS["16:9"]).toEqual({
        ratio: "16:9",
        width: 1920,
        height: 1080,
        label: expect.stringContaining("१६:९"),
        description: expect.any(String),
      });

      expect(CANVAS_PRESETS["9:16"]).toEqual({
        ratio: "9:16",
        width: 1080,
        height: 1920,
        label: expect.stringContaining("९:१६"),
        description: expect.any(String),
      });

      expect(CANVAS_PRESETS["1:1"].width).toBe(1080);
      expect(CANVAS_PRESETS["1:1"].height).toBe(1080);

      expect(CANVAS_PRESETS["4:5"].width).toBe(1080);
      expect(CANVAS_PRESETS["4:5"].height).toBe(1350);
    });
  });

  describe("3. Project Creation Factory (createProjectFromTemplate)", () => {
    it("generates a new project with valid ID, dimensions, and default graphics", () => {
      const proj = createProjectFromTemplate("breaking-news", "मोठी ब्रेकिंग न्यूज", {
        headline: "जामखेड बाजार समितीत विक्रमी आवक",
        location: "जामखेड",
        reporterName: "समीर शेख",
      });

      expect(proj.id).toMatch(/^proj_/);
      expect(proj.title).toBe("मोठी ब्रेकिंग न्यूज");
      expect(proj.width).toBe(1920);
      expect(proj.height).toBe(1080);
      expect(proj.duration).toBe(45);
      expect(proj.canvasRatio).toBe("16:9");

      // Verify default graphics
      const logoGraphic = proj.graphics.find((g) => g.type === "logo-watermark");
      expect(logoGraphic).toBeDefined();
      expect(logoGraphic?.trackId).toBe("V4");
      expect(logoGraphic?.title).toBe("आवाज जामखेडचा");

      const tickerGraphic = proj.graphics.find((g) => g.type === "running-ticker");
      expect(tickerGraphic).toBeDefined();
      expect(tickerGraphic?.trackId).toBe("V3");
      expect(tickerGraphic?.animation).toBe("ticker-scroll");

      // Verify audio mixer tracks
      expect(proj.audioMixer.length).toBe(4);
      const musicTrack = proj.audioMixer.find((m) => m.trackId === "A4");
      expect(musicTrack?.duckingEnabled).toBe(true);
      expect(musicTrack?.duckingAmountPercent).toBe(15);
    });

    it("respects vertical 9:16 template dimensions when creating shorts-reel project", () => {
      const proj = createProjectFromTemplate("shorts-reel");
      expect(proj.canvasRatio).toBe("9:16");
      expect(proj.width).toBe(1080);
      expect(proj.height).toBe(1920);
      expect(proj.duration).toBe(30);
    });
  });

  describe("4. News Graphics Suite & Typography", () => {
    it("defines 13+ standard broadcast graphics with Marathi labels and default durations", () => {
      const graphicsKeys = Object.keys(GRAPHIC_TYPE_DEFINITIONS);
      expect(graphicsKeys.length).toBeGreaterThanOrEqual(13);

      expect(GRAPHIC_TYPE_DEFINITIONS["lower-third"]).toBeDefined();
      expect(GRAPHIC_TYPE_DEFINITIONS["lower-third"].labelMarathi).toContain("लोअर थर्ड");

      expect(GRAPHIC_TYPE_DEFINITIONS["running-ticker"]).toBeDefined();
      expect(GRAPHIC_TYPE_DEFINITIONS["running-ticker"].labelMarathi).toContain("टिकर");

      expect(GRAPHIC_TYPE_DEFINITIONS["breaking-bar"]).toBeDefined();
      expect(GRAPHIC_TYPE_DEFINITIONS["breaking-bar"].labelMarathi).toContain("ब्रेकिंग");
    });

    it("provides the four required Marathi typography fonts", () => {
      expect(NEWS_GRAPHIC_FONTS["tiro-press"]).toBeDefined();
      expect(NEWS_GRAPHIC_FONTS["mukta"]).toBeDefined();
      expect(NEWS_GRAPHIC_FONTS["noto-serif"]).toBeDefined();
      expect(NEWS_GRAPHIC_FONTS["noto-sans"]).toBeDefined();
    });
  });

  describe("5. FFmpeg Filtergraph Generator", () => {
    it("builds a valid filter complex string with scaling and overlays", () => {
      const proj = createProjectFromTemplate("ground-report");
      // Add a mock video clip
      proj.videoClips.push({
        id: "clip_1",
        trackId: "V1",
        assetUrl: "https://example.com/video.mp4",
        title: "Test Footage",
        startTime: 0,
        duration: 10,
        sourceIn: 0,
        sourceOut: 10,
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

      const { filterComplex, inputArgs, outputArgs, fullCommand } = buildFfmpegFilterComplex(proj);

      expect(filterComplex).toBeTruthy();
      expect(inputArgs.length).toBeGreaterThan(0);
      expect(outputArgs).toContain("-r");
      expect(outputArgs).toContain("30");
      expect(filterComplex).toContain("scale=1920:1080");
      expect(fullCommand).toContain("ffmpeg");
    });
  });

  describe("6. ElevenLabs Voice Configuration", () => {
    it("provides clean voice presets with IDs and language notes", () => {
      expect(DEFAULT_ELEVENLABS_VOICES.length).toBeGreaterThanOrEqual(4);
      DEFAULT_ELEVENLABS_VOICES.forEach((v) => {
        expect(v.voiceId).toBeTruthy();
        expect(v.name).toBeTruthy();
        expect(["male", "female"]).toContain(v.gender);
      });
    });
  });
});
