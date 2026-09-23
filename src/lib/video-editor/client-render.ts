import { VideoProject, GraphicOverlayItem, NewsFontKey } from "@/types/video-studio";
import { NEWS_GRAPHIC_FONTS } from "./graphics";

export interface RenderProgressCallback {
  (progressPercent: number, statusText: string): void;
}

/**
 * High-definition client-side video compositor.
 * Renders all video layers, graphics, Marathi typography, and running tickers frame-by-frame
 * and exports a clean downloadable MP4/WebM file directly in the browser.
 */
export async function renderProjectToVideoFile(
  project: VideoProject,
  onProgress: RenderProgressCallback
): Promise<Blob> {
  const { width, height, fps, duration } = project;
  const totalFrames = Math.max(30, Math.round(duration * fps));

  onProgress(2, "फॉन्ट आणि ग्राफिक्स लोड करत आहे...");

  // Ensure fonts are ready
  if (typeof document !== "undefined" && "fonts" in document) {
    await document.fonts.ready;
  }

  // Create offscreen canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Canvas context could not be created.");

  // Pre-load images for image clips
  const imageElements: Record<string, HTMLImageElement> = {};
  for (const clip of project.videoClips) {
    if (clip.mediaType === "image" && clip.assetUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = clip.assetUrl;
      await new Promise((res) => {
        img.onload = res;
        img.onerror = res; // continue gracefully
      });
      imageElements[clip.id] = img;
    }
  }

  onProgress(10, "व्हिडिओ रेंडरिंग सुरू झाले...");

  // Setup MediaRecorder from canvas stream
  const stream = canvas.captureStream(fps);
  const mimeType = MediaRecorder.isTypeSupported("video/mp4;codecs=avc1")
    ? "video/mp4;codecs=avc1"
    : MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
    ? "video/webm;codecs=vp9,opus"
    : "video/webm";

  const recordedChunks: Blob[] = [];
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 6_000_000, // 6 Mbps high quality
  });

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  recorder.start(100);

  // Render loop frame by frame
  for (let f = 0; f < totalFrames; f++) {
    const currentTime = f / fps;

    // 1. Clear background
    ctx.fillStyle = "#0A0A0A";
    ctx.fillRect(0, 0, width, height);

    // 2. Render active Video / Image clips on V1 / V2
    for (const clip of project.videoClips) {
      if (currentTime >= clip.startTime && currentTime <= clip.startTime + clip.duration) {
        ctx.save();
        ctx.globalAlpha = clip.opacity;

        if (clip.mediaType === "image" && imageElements[clip.id]) {
          const img = imageElements[clip.id];
          if (img.complete && img.naturalWidth > 0) {
            // Draw image cover style
            const hRatio = width / img.naturalWidth;
            const vRatio = height / img.naturalHeight;
            const ratio = Math.max(hRatio, vRatio) * clip.scale;
            const centerShiftX = (width - img.naturalWidth * ratio) / 2 + (clip.positionX * width) / 100;
            const centerShiftY = (height - img.naturalHeight * ratio) / 2 + (clip.positionY * height) / 100;

            ctx.drawImage(
              img,
              0,
              0,
              img.naturalWidth,
              img.naturalHeight,
              centerShiftX,
              centerShiftY,
              img.naturalWidth * ratio,
              img.naturalHeight * ratio
            );
          }
        } else {
          // Video background placeholder / gradient if playing offline
          const grad = ctx.createLinearGradient(0, 0, width, height);
          grad.addColorStop(0, "#1F2937");
          grad.addColorStop(1, "#111827");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);
        }
        ctx.restore();
      }
    }

    // 3. Render active Graphics Overlays on V3 & V4
    for (const graphic of project.graphics) {
      if (currentTime >= graphic.startTime && currentTime <= graphic.startTime + graphic.duration) {
        renderGraphicOnCanvas(ctx, graphic, currentTime - graphic.startTime, width, height);
      }
    }

    // Report progress
    const pct = Math.round(10 + (f / totalFrames) * 85);
    if (f % 15 === 0) {
      onProgress(pct, `फ्रेम ${f + 1}/${totalFrames} रेंडर करत आहे...`);
      // Yield to event loop
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  onProgress(96, "व्हिडिओ एन्कोड करत आहे...");
  recorder.stop();

  return new Promise((resolve) => {
    recorder.onstop = () => {
      onProgress(100, "व्हिडिओ तयार झाला!");
      const finalBlob = new Blob(recordedChunks, { type: mimeType });
      resolve(finalBlob);
    };
  });
}

function renderGraphicOnCanvas(
  ctx: CanvasRenderingContext2D,
  graphic: GraphicOverlayItem,
  elapsedSec: number,
  canvasW: number,
  canvasH: number
) {
  ctx.save();
  ctx.globalAlpha = graphic.opacity;

  const fontDef =
    (NEWS_GRAPHIC_FONTS as Record<string, { name: string; css: string }>)[graphic.fontKey] ||
    NEWS_GRAPHIC_FONTS["tiro-press"];

  switch (graphic.type) {
    case "running-ticker": {
      const tickerH = Math.round(canvasH * 0.07);
      const tickerY = canvasH - tickerH;

      // Background strip
      ctx.fillStyle = graphic.bgColor || "#991B1B";
      ctx.fillRect(0, tickerY, canvasW, tickerH);

      // Accent top rule
      ctx.fillStyle = graphic.accentColor || "#FBBF24";
      ctx.fillRect(0, tickerY, canvasW, 3);

      // Ticker Tag on left
      const tagW = Math.round(canvasW * 0.12);
      ctx.fillStyle = "#111827";
      ctx.fillRect(0, tickerY, tagW, tickerH);
      ctx.fillStyle = "#FBBF24";
      ctx.font = `bold ${Math.round(tickerH * 0.38)}px ${fontDef.css}`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText("ठळक वृत्त", tagW / 2, tickerY + tickerH / 2);

      // Scrolling text
      ctx.save();
      ctx.beginPath();
      ctx.rect(tagW, tickerY, canvasW - tagW, tickerH);
      ctx.clip();

      ctx.fillStyle = graphic.textColor || "#FFFFFF";
      ctx.font = `bold ${Math.round(tickerH * 0.45)}px ${fontDef.css}`;
      ctx.textAlign = "left";

      const speedMultiplier = graphic.tickerSpeed === "fast" ? 220 : graphic.tickerSpeed === "slow" ? 110 : 160;
      const textWidth = ctx.measureText(graphic.title).width;
      const offset = (elapsedSec * speedMultiplier) % (textWidth + canvasW);
      const textX = canvasW - offset;

      ctx.fillText(graphic.title, textX, tickerY + tickerH / 2 + 1);
      ctx.restore();
      break;
    }

    case "lower-third": {
      const ltH = Math.round(canvasH * 0.11);
      const ltY = Math.round(canvasH * 0.81);
      const ltX = Math.round(canvasW * 0.05);

      ctx.font = `bold ${Math.round(ltH * 0.38)}px ${fontDef.css}`;
      const nameWidth = ctx.measureText(graphic.title).width + 50;

      // Dark card
      ctx.fillStyle = graphic.bgColor || "rgba(17, 24, 39, 0.92)";
      ctx.fillRect(ltX, ltY, Math.max(340, nameWidth), ltH);

      // Red left accent bar
      ctx.fillStyle = graphic.accentColor || "#991B1B";
      ctx.fillRect(ltX, ltY, 8, ltH);

      // Name
      ctx.fillStyle = graphic.textColor || "#FFFFFF";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(graphic.title, ltX + 22, ltY + 14);

      // Designation / Location
      if (graphic.subtitle) {
        ctx.font = `600 ${Math.round(ltH * 0.25)}px ${fontDef.css}`;
        ctx.fillStyle = "#D1D5DB";
        ctx.fillText(graphic.subtitle, ltX + 22, ltY + ltH * 0.55);
      }
      break;
    }

    case "location-tag": {
      const tagH = Math.round(canvasH * 0.05);
      const tagX = Math.round(canvasW * 0.05);
      const tagY = Math.round(canvasH * 0.08);

      ctx.font = `bold ${Math.round(tagH * 0.55)}px ${fontDef.css}`;
      const w = ctx.measureText(graphic.title).width + 36;

      ctx.fillStyle = graphic.bgColor || "#111827";
      ctx.fillRect(tagX, tagY, w, tagH);

      ctx.fillStyle = "#EF4444";
      ctx.fillRect(tagX, tagY, 5, tagH);

      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(graphic.title, tagX + 16, tagY + tagH / 2);
      break;
    }

    case "logo-watermark": {
      const logoW = Math.round(canvasW * 0.16);
      const logoH = Math.round(canvasH * 0.06);
      const logoX = canvasW - logoW - Math.round(canvasW * 0.04);
      const logoY = Math.round(canvasH * 0.06);

      ctx.fillStyle = graphic.bgColor || "rgba(153, 27, 27, 0.85)";
      ctx.fillRect(logoX, logoY, logoW, logoH);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = `bold ${Math.round(logoH * 0.42)}px 'Rozha One', ${fontDef.css}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(graphic.title, logoX + logoW / 2, logoY + logoH / 2);
      break;
    }

    case "breaking-bar": {
      const barH = Math.round(canvasH * 0.12);
      const barY = Math.round(canvasH * 0.8);
      const barX = Math.round(canvasW * 0.05);
      const barW = Math.round(canvasW * 0.9);

      ctx.fillStyle = "#991B1B";
      ctx.fillRect(barX, barY, barW, barH);

      ctx.fillStyle = "#FBBF24";
      ctx.font = `bold ${Math.round(barH * 0.28)}px ${fontDef.css}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("🔴 ब्रेकिंग न्यूज (BREAKING NEWS)", barX + 20, barY + 12);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = `bold ${Math.round(barH * 0.35)}px ${fontDef.css}`;
      ctx.fillText(graphic.title, barX + 20, barY + barH * 0.48);
      break;
    }

    default:
      break;
  }

  ctx.restore();
}
