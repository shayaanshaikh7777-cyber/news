import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { ElevenLabsVoiceOption } from "@/types/video-studio";
import { DEFAULT_ELEVENLABS_VOICES } from "./voices";

export { DEFAULT_ELEVENLABS_VOICES };

export interface TTSGenerationResult {
  success: boolean;
  audioUrl?: string;
  durationSeconds?: number;
  error?: string;
  isMockFallback?: boolean;
}

/**
 * Server-side ElevenLabs Text-to-Speech caller.
 * Strictly protects ELEVENLABS_API_KEY from ever leaking to the client.
 */
export async function generateElevenLabsVoice(params: {
  text: string;
  voiceId?: string;
  modelId?: string;
}): Promise<TTSGenerationResult> {
  const { text, voiceId = "21m00Tcm4TlvDq8ikWAM", modelId = "eleven_multilingual_v2" } = params;

  if (!text || text.trim().length === 0) {
    return { success: false, error: "व्हॉइस तयार करण्यासाठी मजकूर आवश्यक आहे." };
  }

  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();

  // If no API key configured, provide a safe simulated newsroom voice so the workflow continues
  if (!apiKey || apiKey.length < 5) {
    console.warn("[ElevenLabs] ELEVENLABS_API_KEY not configured. Generating placeholder audio.");
    const placeholderResult = await savePlaceholderAudio(text);
    return {
      success: true,
      audioUrl: placeholderResult.url,
      durationSeconds: placeholderResult.duration,
      isMockFallback: true,
    };
  }

  try {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[ElevenLabs API error]", response.status, errText);
      return {
        success: false,
        error: `ElevenLabs त्रुटी (${response.status}): ${errText.slice(0, 100)}`,
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save audio file to public/uploads/audio
    const saved = await persistAudioBuffer(buffer, "mp3");
    // Approximate duration: 15 characters per second for news speaking rate
    const approxDuration = Math.max(3, Math.round(text.length / 14));

    return {
      success: true,
      audioUrl: saved.url,
      durationSeconds: approxDuration,
      isMockFallback: false,
    };
  } catch (err: unknown) {
    console.error("[generateElevenLabsVoice error]", err);
    const msg = err instanceof Error ? err.message : "व्हॉइस जनरेशन अयशस्वी";
    return { success: false, error: msg };
  }
}

/**
 * Persists an audio buffer to storage (public/uploads/audio/...) or tmpdir in serverless
 */
export async function persistAudioBuffer(
  buffer: Buffer,
  extension: string = "mp3"
): Promise<{ url: string; filePath: string }> {
  const hash = crypto.randomBytes(12).toString("hex");
  const fileName = `awaaz-voice-${hash}.${extension}`;
  const relativeDir = path.join("uploads", "audio");

  let targetDir = path.join(process.cwd(), "public", relativeDir);
  let canWrite = false;

  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const testFile = path.join(targetDir, `.test-${hash}`);
    fs.writeFileSync(testFile, "1");
    fs.unlinkSync(testFile);
    canWrite = true;
  } catch {
    canWrite = false;
  }

  if (!canWrite) {
    targetDir = path.join(os.tmpdir(), relativeDir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
  }

  const filePath = path.join(targetDir, fileName);
  fs.writeFileSync(filePath, buffer);

  const url = `/uploads/audio/${fileName}`;
  return { url, filePath };
}

/**
 * Creates a silent/minimal tone placeholder audio when API key is not yet set
 */
async function savePlaceholderAudio(text: string): Promise<{ url: string; duration: number }> {
  // 1-second minimal MP3 frame header buffer
  const minimalMp3 = Buffer.from([
    0xff, 0xfb, 0x90, 0x64, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]);
  const saved = await persistAudioBuffer(minimalMp3, "mp3");
  const duration = Math.max(3, Math.round(text.length / 15));
  return { url: saved.url, duration };
}
