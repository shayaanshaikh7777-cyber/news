import { describe, it, expect } from "vitest";
import sharp from "sharp";
import {
  validateImageMagicBytes,
  optimizeImageBuffer,
} from "../src/lib/media/optimizer";

describe("Media Optimizer — Magic Bytes Validation", () => {
  it("recognizes valid JPEG header", () => {
    const fakeJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const res = validateImageMagicBytes(fakeJpeg);
    expect(res.valid).toBe(true);
    expect(res.detectedFormat).toBe("jpeg");
  });

  it("recognizes valid PNG header", () => {
    const fakePng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
    const res = validateImageMagicBytes(fakePng);
    expect(res.valid).toBe(true);
    expect(res.detectedFormat).toBe("png");
  });

  it("recognizes valid WebP header", () => {
    const fakeWebp = Buffer.concat([
      Buffer.from("RIFF", "ascii"),
      Buffer.from([0x20, 0x00, 0x00, 0x00]),
      Buffer.from("WEBP", "ascii"),
      Buffer.from("VP8 ", "ascii"),
    ]);
    const res = validateImageMagicBytes(fakeWebp);
    expect(res.valid).toBe(true);
    expect(res.detectedFormat).toBe("webp");
  });

  it("rejects non-image text/script files", () => {
    const textBuffer = Buffer.from("<?php echo 'malicious'; ?>");
    const res = validateImageMagicBytes(textBuffer);
    expect(res.valid).toBe(false);
    expect(res.error).toContain("असमर्थित");
  });

  it("rejects truncated or tiny buffers", () => {
    const tiny = Buffer.from([0x01, 0x02]);
    const res = validateImageMagicBytes(tiny);
    expect(res.valid).toBe(false);
  });
});

describe("Media Optimizer — Sharp Image Optimization", () => {
  it("optimizes a high-resolution PNG to WebP with responsive thumbnail", async () => {
    // Generate a test 1000x800 PNG image with gradient
    const testPngBuffer = await sharp({
      create: {
        width: 1000,
        height: 800,
        channels: 4,
        background: { r: 180, g: 30, b: 30, alpha: 0.9 },
      },
    })
      .png()
      .toBuffer();

    const result = await optimizeImageBuffer(testPngBuffer, {
      preferredFormat: "webp",
      maxWidth: 1920,
      quality: 80,
      thumbnailWidth: 320,
    });

    expect(result.format).toBe("webp");
    expect(result.mimeType).toBe("image/webp");
    expect(result.width).toBe(1000);
    expect(result.height).toBe(800);
    expect(result.thumbnailWidth).toBe(320);
    expect(result.thumbnailBuffer.length).toBeGreaterThan(0);
    expect(result.originalSize).toBe(testPngBuffer.length);
    expect(result.optimizedSize).toBeGreaterThan(0);
    expect(result.savedPercent).toBeDefined();

    // Verify generated buffer is a readable WebP
    const meta = await sharp(result.buffer).metadata();
    expect(meta.format).toBe("webp");
  });

  it("converts image to AVIF format when preferred", async () => {
    const testJpegBuffer = await sharp({
      create: {
        width: 600,
        height: 400,
        channels: 3,
        background: { r: 20, g: 100, b: 200 },
      },
    })
      .jpeg({ quality: 90 })
      .toBuffer();

    const result = await optimizeImageBuffer(testJpegBuffer, {
      preferredFormat: "avif",
      quality: 70,
    });

    expect(result.format).toBe("avif");
    expect(result.mimeType).toBe("image/avif");
    expect(result.width).toBe(600);
    expect(result.height).toBe(400);

    const meta = await sharp(result.buffer).metadata();
    expect(meta.format).toBe("heif"); // sharp categorizes avif under heif family
  });

  it("resizes images larger than maxWidth while keeping aspect ratio", async () => {
    const largeBuffer = await sharp({
      create: {
        width: 2400,
        height: 1200,
        channels: 3,
        background: { r: 50, g: 50, b: 50 },
      },
    })
      .jpeg()
      .toBuffer();

    const result = await optimizeImageBuffer(largeBuffer, {
      maxWidth: 1200,
      maxHeight: 1200,
    });

    expect(result.width).toBe(1200);
    expect(result.height).toBe(600); // 2:1 aspect ratio maintained
  });
});

