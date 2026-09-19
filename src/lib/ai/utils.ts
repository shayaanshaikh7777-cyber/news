/**
 * AI Gateway Security & Diagnostic Utilities
 * Provides credential sanitization and Server-Side Request Forgery (SSRF) validation.
 */

/**
 * Sanitizes any sensitive tokens, API keys, or authorization headers from error text.
 * Prevents credentials from leaking into server logs, client UI, or audit records.
 */
export function sanitizeError(text: string): string {
  if (!text) return "";
  return String(text)
    .replace(/AIza[0-9A-Za-z-_]+/g, "AIza••••••••")
    .replace(/sk-(?:proj-)?[0-9A-Za-z-_]{20,}/g, "sk-••••••••")
    .replace(/(?:key|apiKey|token|secret|password)=([^\s&"']+)/gi, "key=••••••••")
    .replace(/bearer\s+[a-zA-Z0-9._-]+/gi, "Bearer ••••••••")
    .slice(0, 300);
}

/**
 * Validates a user-configured or remote AI baseUrl to protect against SSRF (Server-Side Request Forgery).
 * Blocks loopback addresses, internal private subnets, cloud metadata endpoints, and non-HTTP(S) schemes.
 */
export function validateSafeUrl(urlStr: string): { valid: boolean; error?: string } {
  if (!urlStr || typeof urlStr !== "string") {
    return { valid: false, error: "URL रिकामी असू शकत नाही." };
  }

  let parsed: URL;
  try {
    parsed = new URL(urlStr.trim());
  } catch {
    return { valid: false, error: "अवैध URL स्वरूप (Invalid URL format)." };
  }

  const isDev = process.env.NODE_ENV === "development";

  // Protocol check: Only HTTPS allowed in production
  if (parsed.protocol !== "https:") {
    if (parsed.protocol === "http:" && isDev) {
      // Allow local development testing over HTTP
    } else {
      return {
        valid: false,
        error: "फक्त सुरक्षित HTTPS प्रोटोकॉल अनुमत आहे (Only HTTPS is allowed).",
      };
    }
  }

  const hostname = parsed.hostname.toLowerCase().trim();

  // Cloud metadata and internal hostname blacklist
  const blockedHostnames = [
    "metadata.google.internal",
    "metadata",
    "instance-data",
    "localhost",
  ];

  if (!isDev && blockedHostnames.includes(hostname)) {
    return {
      valid: false,
      error: `अंतर्गत किंवा प्रतिबंधित होस्ट वापरता येत नाही (${hostname}).`,
    };
  }

  // IPv4 Private & Link-Local / Cloud Metadata checks
  // 127.0.0.0/8 (Loopback)
  if (!isDev && /^127\./.test(hostname)) {
    return { valid: false, error: "Loopback IP पत्ता अनुमत नाही." };
  }

  // 169.254.0.0/16 (Link Local / Cloud Metadata e.g. AWS/GCP 169.254.169.254)
  if (/^169\.254\./.test(hostname)) {
    return { valid: false, error: "Cloud Metadata IP पत्ता प्रतिबंधित आहे." };
  }

  // 10.0.0.0/8 (Private A)
  if (!isDev && /^10\./.test(hostname)) {
    return { valid: false, error: "खाजगी अंतर्गत नेटवर्क (Private Network) IP अनुमत नाही." };
  }

  // 172.16.0.0/12 (Private B)
  if (!isDev && /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) {
    return { valid: false, error: "खाजगी अंतर्गत नेटवर्क (Private Network) IP अनुमत नाही." };
  }

  // 192.168.0.0/16 (Private C)
  if (!isDev && /^192\.168\./.test(hostname)) {
    return { valid: false, error: "खाजगी अंतर्गत नेटवर्क (Private Network) IP अनुमत नाही." };
  }

  // 0.0.0.0
  if (hostname === "0.0.0.0" || hostname === "::") {
    return { valid: false, error: "अवैध IP पत्ता." };
  }

  return { valid: true };
}

