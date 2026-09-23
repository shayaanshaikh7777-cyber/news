import { VideoProject } from "@/types/video-studio";

export interface FFmpegPipelineSpec {
  inputArgs: string[];
  filterComplex: string;
  outputArgs: string[];
  fullCommand: string;
}

/**
 * Translates structured timeline data into a production-grade FFmpeg command specification.
 */
export function buildFFmpegCommand(
  project: VideoProject,
  outputFilename: string = "output.mp4"
): FFmpegPipelineSpec {
  const inputs: string[] = [];
  const filterParts: string[] = [];

  const { width, height, fps } = project;

  // Color background base canvas
  filterParts.push(`color=c=black:s=${width}x${height}:r=${fps}:d=${project.duration}[base]`);
  let currentVideoOutput = "[base]";

  // 1. Process Video Clips on V1 & V2
  let videoInputIndex = 0;
  const sortedClips = [...project.videoClips].sort((a, b) => a.startTime - b.startTime);

  sortedClips.forEach((clip, idx) => {
    inputs.push("-i", clip.assetUrl);
    const inTag = `[${videoInputIndex}:v]`;
    const scaledTag = `[v_scaled_${idx}]`;
    const nextOutput = `[v_out_${idx}]`;

    // Scale clip to canvas proportions and set timing
    filterParts.push(
      `${inTag}scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setpts=PTS-STARTPTS+${clip.startTime}/TB${scaledTag}`
    );

    // Overlay on canvas
    filterParts.push(
      `${currentVideoOutput}${scaledTag}overlay=enable='between(t,${clip.startTime},${clip.startTime + clip.duration})'${nextOutput}`
    );

    currentVideoOutput = nextOutput;
    videoInputIndex++;
  });

  // 2. Process Graphics Overlays (Lower Thirds, Tickers, Watermarks)
  project.graphics.forEach((graphic, idx) => {
    const nextOutput = `[v_g_${idx}]`;

    if (graphic.type === "running-ticker") {
      // Horizontal scrolling text ticker at bottom
      const yPos = Math.round(height * 0.92);
      const cleanText = graphic.title.replace(/'/g, "\\'").replace(/:/g, "\\:");
      filterParts.push(
        `${currentVideoOutput}drawtext=text='${cleanText}':fontcolor=${graphic.textColor}:fontsize=${graphic.fontSize * 1.5}:box=1:boxcolor=${graphic.bgColor}@0.9:boxborderw=12:x=w-mod(t*180\\,w+tw):y=${yPos}:enable='between(t,${graphic.startTime},${graphic.startTime + graphic.duration})'${nextOutput}`
      );
      currentVideoOutput = nextOutput;
    } else if (graphic.type === "lower-third") {
      const yPos = Math.round(height * 0.78);
      const cleanTitle = graphic.title.replace(/'/g, "\\'");
      const cleanSub = (graphic.subtitle || "").replace(/'/g, "\\'");
      filterParts.push(
        `${currentVideoOutput}drawtext=text='${cleanTitle}':fontcolor=${graphic.textColor}:fontsize=${graphic.fontSize * 1.4}:box=1:boxcolor=${graphic.bgColor}@0.9:boxborderw=10:x=80:y=${yPos}:enable='between(t,${graphic.startTime},${graphic.startTime + graphic.duration})',drawtext=text='${cleanSub}':fontcolor=white:fontsize=22:x=80:y=${yPos + 45}:enable='between(t,${graphic.startTime},${graphic.startTime + graphic.duration})'${nextOutput}`
      );
      currentVideoOutput = nextOutput;
    } else if (graphic.type === "location-tag") {
      const cleanLoc = graphic.title.replace(/'/g, "\\'");
      filterParts.push(
        `${currentVideoOutput}drawtext=text='${cleanLoc}':fontcolor=white:fontsize=24:box=1:boxcolor=black@0.85:boxborderw=8:x=80:y=80:enable='between(t,${graphic.startTime},${graphic.startTime + graphic.duration})'${nextOutput}`
      );
      currentVideoOutput = nextOutput;
    }
  });

  // 3. Audio Mixing with Ducking
  const audioInputs = project.audioClips;
  let audioFilter = "";
  if (audioInputs.length > 0) {
    audioInputs.forEach((a) => {
      inputs.push("-i", a.assetUrl);
    });
    audioFilter = `-filter_complex "amix=inputs=${audioInputs.length}:duration=longest"`;
  }

  const filterComplex = filterParts.join(";");
  const outputArgs = [
    "-map",
    currentVideoOutput,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-r",
    String(fps),
    "-preset",
    "fast",
    "-t",
    String(project.duration),
    "-y",
    outputFilename,
  ];

  const fullCommand = `ffmpeg ${inputs.join(" ")} -filter_complex "${filterComplex}" ${outputArgs.join(" ")}`;

  return {
    inputArgs: inputs,
    filterComplex,
    outputArgs,
    fullCommand,
  };
}

export const buildFfmpegFilterComplex = buildFFmpegCommand;
