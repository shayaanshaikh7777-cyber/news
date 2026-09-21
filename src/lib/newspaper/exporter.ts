import { NewspaperEdition, NewspaperPage, PAGE_DIMENSIONS } from "@/types/newspaper";

export interface ValidationError {
  pageNumber: number;
  message: string;
  severity: "error" | "warning";
}

/**
 * Validates the newspaper edition before export to prevent blank pages or critical errors.
 */
export function validateNewspaperEdition(edition: NewspaperEdition): ValidationError[] {
  const issues: ValidationError[] = [];

  if (!edition.pages || edition.pages.length === 0) {
    issues.push({ pageNumber: 1, message: "वृत्तपत्रात किमान १ पान असणे आवश्यक आहे.", severity: "error" });
    return issues;
  }

  edition.pages.forEach((page, idx) => {
    const pageNum = page.pageNumber || idx + 1;
    const contentModules = page.modules.filter(
      (m) => m.type !== "masthead" && m.type !== "dateline" && m.type !== "footer"
    );

    if (contentModules.length === 0) {
      issues.push({
        pageNumber: pageNum,
        message: `पान ${pageNum} वर कोणतीही बातमी किंवा मजकूर जोडलेला नाही.`,
        severity: "warning",
      });
    }

    // Check for images without URLs
    page.modules.forEach((mod) => {
      if ((mod.type === "hero-image" || mod.type === "single-image") && !mod.image?.url) {
        issues.push({
          pageNumber: pageNum,
          message: `पान ${pageNum}: फोटो मॉड्यूलमध्ये प्रतिमा जोडलेली नाही.`,
          severity: "warning",
        });
      }
    });
  });

  return issues;
}

/**
 * Triggers browser-native high-quality print to PDF with pre-loaded fonts and exact print margins.
 */
export function exportNewspaperToPDF(): void {
  if (typeof window === "undefined") return;

  // Ensure fonts are loaded before triggering print
  if ("fonts" in document) {
    document.fonts.ready.then(() => {
      setTimeout(() => {
        window.print();
      }, 300);
    });
  } else {
    window.print();
  }
}

/**
 * Converts a DOM element to a high-resolution PNG or JPG using HTML5 Canvas.
 */
export async function exportElementToImage(
  element: HTMLElement,
  format: "png" | "jpeg" = "png",
  fileName: string = "newspaper-page"
): Promise<void> {
  if (typeof window === "undefined") return;

  // Ensure fonts are active
  if ("fonts" in document) {
    await document.fonts.ready;
  }

  const scale = 2; // 2x high resolution
  const width = element.offsetWidth;
  const height = element.offsetHeight;

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context could not be created.");
  }

  ctx.scale(scale, scale);

  // SVG ForeignObject rasterization approach
  const clone = element.cloneNode(true) as HTMLElement;

  // Remove any interactive selection borders or buttons in the clone
  clone.querySelectorAll(".no-print, [data-no-print]").forEach((el) => el.remove());
  clone.style.transform = "none";
  clone.style.boxShadow = "none";
  clone.style.margin = "0";

  const serializedHtml = new XMLSerializer().serializeToString(clone);

  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        ${serializedHtml}
      </foreignObject>
    </svg>
  `;

  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);

      const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
      const dataUrl = canvas.toDataURL(mimeType, 0.95);

      const link = document.createElement("a");
      link.download = `${fileName}.${format === "jpeg" ? "jpg" : "png"}`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      resolve();
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

