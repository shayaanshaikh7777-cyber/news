import sharp from "sharp";

export interface OptimizedImageResult {
  format: "webp" | "avif" | "jpeg" | "png";
  mimeType: string;
  width: number;
  height: number;
  originalSize: number;
  optimizedSize: number;
  savedBytes: number;
  savedPercent: number;
  buffer: Buffer;
  thumbnailBuffer: Buffer;
  thumbnailWidth: number;
  thumbnailHeight: number;
  hasAlpha: boolean;
}

export interface ImageOptimizationOptions {
  preferredFormat?: "webp" | "avif";
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  thumbnailWidth?: number;
}

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_DIMENSION = 8000; // 8000 px max width or height
const MAX_MEGAPIXELS = 40; // 40 MP max to prevent decompression bombs

/**
 * Validates image magic bytes to ensure file is genuinely an image (JPEG, PNG, WebP, AVIF).
 * Protects against disguised executables, scripts, or malicious polyglots.
 */
export function validateImageMagicBytes(buffer: Buffer): {
  valid: boolean;
  detectedFormat?: string;
  error?: string;
} {
  if (!buffer || buffer.length < 12) {
    return { valid: false, error: "फाईल रिकामी किंवा अपुरी आहे (Buffer too small)." };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, detectedFormat: "jpeg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { valid: true, detectedFormat: "png" };
  }

  // WebP: RIFF ... WEBP
  const riffHeader = buffer.subarray(0, 4).toString("ascii");
  const webpHeader = buffer.subarray(8, 12).toString("ascii");
  if (riffHeader === "RIFF" && webpHeader === "WEBP") {
    return { valid: true, detectedFormat: "webp" };
  }

  // AVIF: ....ftypavif or ....ftypavis
  if (buffer.length >= 16) {
    const ftyp = buffer.subarray(4, 12).toString("ascii");
    if (ftyp.includes("ftypavif") || ftyp.includes("ftypavis")) {
      return { valid: true, detectedFormat: "avif" };
    }
  }

  return {
    valid: false,
    error: "अवैध किंवा असमर्थित इमेज फॉरमॅट. कृपया JPG, PNG, WebP किंवा AVIF अपलोड करा.",
  };
}

/**
 * Optimizes an image buffer using Sharp:
 * 1. Checks file size and decompression bomb thresholds.
 * 2. Normalizes orientation via EXIF.
 * 3. Strips GPS and camera EXIF metadata.
 * 4. Preserves transparency for alpha-bearing images.
 * 5. Compresses into modern WebP/AVIF format with balanced visual quality.
 * 6. Generates a responsive thumbnail variant.
 */
export async function optimizeImageBuffer(
  inputBuffer: Buffer,
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImageResult> {
  const originalSize = inputBuffer.length;

  if (originalSize > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `इमेजचा आकार खूप मोठा आहे (${(originalSize / (1024 * 1024)).toFixed(1)} MB). कमाल मर्यादा 25 MB आहे.`
    );
  }

  // Magic byte security check
  const magicCheck = validateImageMagicBytes(inputBuffer);
  if (!magicCheck.valid) {
    throw new Error(magicCheck.error || "अवैध इमेज फाईल.");
  }

  const {
    preferredFormat = "webp",
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 82,
    thumbnailWidth = 360,
  } = options;

  // Inspect image metadata with Sharp
  const metadata = await sharp(inputBuffer).metadata();
  const rawWidth = metadata.width || 0;
  const rawHeight = metadata.height || 0;

  if (rawWidth > MAX_DIMENSION || rawHeight > MAX_DIMENSION) {
    throw new Error(
      `इमेजचे रिझोल्यूशन फार मोठे आहे (${rawWidth}×${rawHeight}). कमाल मर्यादा ${MAX_DIMENSION}px आहे.`
    );
  }

  const megapixels = (rawWidth * rawHeight) / 1000000;
  if (megapixels > MAX_MEGAPIXELS) {
    throw new Error(
      `इमेज खूप उच्च मेगॅपिक्सलची आहे (${megapixels.toFixed(1)} MP). मेमरी सुरक्षेसाठी हे नाकारले गेले आहे.`
    );
  }

  const hasAlpha = Boolean(metadata.hasAlpha);

  // Initialize pipeline with auto-orientation (Sharp strips EXIF/GPS metadata by default)
  let pipeline = sharp(inputBuffer).rotate();

  // Downscale only if larger than target dimensions
  if (rawWidth > maxWidth || rawHeight > maxHeight) {
    pipeline = pipeline.resize({
      width: maxWidth,
      height: maxHeight,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  let finalBuffer: Buffer;
  let finalFormat: "webp" | "avif" | "jpeg" | "png";
  let finalMime: string;

  if (preferredFormat === "avif") {
    finalFormat = "avif";
    finalMime = "image/avif";
    finalBuffer = await pipeline
      .avif({
        quality: Math.min(quality, 75),
        effort: 4,
        chromaSubsampling: hasAlpha ? "4:4:4" : "4:2:0",
      })
      .toBuffer();
  } else {
    // Default to WebP: universal support and exceptional compression
    finalFormat = "webp";
    finalMime = "image/webp";
    finalBuffer = await pipeline
      .webp({
        quality,
        effort: 4,
        alphaQuality: 85,
        smartSubsample: true,
      })
      .toBuffer();
  }

  // Measure optimized image dimensions
  const finalMeta = await sharp(finalBuffer).metadata();
  const optimizedSize = finalBuffer.length;
  const savedBytes = Math.max(0, originalSize - optimizedSize);
  const savedPercent =
    originalSize > 0
      ? Math.max(0, Number((((originalSize - optimizedSize) / originalSize) * 100).toFixed(1)))
      : 0;

  // Generate responsive thumbnail
  const thumbnailBuffer = await sharp(finalBuffer)
    .resize({
      width: thumbnailWidth,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 78, effort: 3 })
    .toBuffer();

  const thumbMeta = await sharp(thumbnailBuffer).metadata();

  return {
    format: finalFormat,
    mimeType: finalMime,
    width: finalMeta.width || rawWidth,
    height: finalMeta.height || rawHeight,
    originalSize,
    optimizedSize,
    savedBytes,
    savedPercent,
    buffer: finalBuffer,
    thumbnailBuffer,
    thumbnailWidth: thumbMeta.width || thumbnailWidth,
    thumbnailHeight: thumbMeta.height || 0,
    hasAlpha,
  };
}
