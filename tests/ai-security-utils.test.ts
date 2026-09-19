import { describe, it, expect } from "vitest";
import { sanitizeError, validateSafeUrl } from "../src/lib/ai/utils";

describe("AI Security Utils — Credential Sanitization", () => {
  it("masks Google Gemini AIza keys", () => {
    const raw = "Error: Invalid key AIzaSyA1234567890abcdefGhIjKlMnOpQrStU for model";
    const sanitized = sanitizeError(raw);
    expect(sanitized).not.toContain("AIzaSyA1234567890abcdefGhIjKlMnOpQrStU");
    expect(sanitized).toContain("AIza••••••••");
  });

  it("masks OpenAI sk- keys", () => {
    const raw = "Authorization failed with sk-proj-1234567890abcdefghijklmnop";
    const sanitized = sanitizeError(raw);
    expect(sanitized).not.toContain("1234567890abcdefghijklmnop");
    expect(sanitized).toContain("sk-••••••••");
  });

  it("masks query string keys and secrets", () => {
    const raw = "Request failed: https://api.example.com/v1?key=secret_token_12345&foo=bar";
    const sanitized = sanitizeError(raw);
    expect(sanitized).not.toContain("secret_token_12345");
    expect(sanitized).toContain("key=••••••••");
  });

  it("masks Bearer tokens", () => {
    const raw = "Headers: Authorization: Bearer ghp_abcdef1234567890abcdef";
    const sanitized = sanitizeError(raw);
    expect(sanitized).not.toContain("ghp_abcdef1234567890abcdef");
    expect(sanitized).toContain("Bearer ••••••••");
  });

  it("handles empty or non-string gracefully", () => {
    expect(sanitizeError("")).toBe("");
  });
});

describe("AI Security Utils — SSRF Validation (validateSafeUrl)", () => {
  it("allows valid public HTTPS endpoints", () => {
    expect(validateSafeUrl("https://api.groq.com/openai/v1").valid).toBe(true);
    expect(validateSafeUrl("https://api.deepseek.com/v1").valid).toBe(true);
    expect(validateSafeUrl("https://api.openai.com/v1").valid).toBe(true);
  });

  it("blocks non-HTTPS protocols in production", () => {
    const originalEnv = (process.env as any).NODE_ENV;
    try {
      (process.env as any).NODE_ENV = "production";
      const result = validateSafeUrl("ftp://api.example.com");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("HTTPS");
    } finally {
      (process.env as any).NODE_ENV = originalEnv;
    }
  });

  it("blocks AWS/GCP cloud metadata IP (169.254.169.254)", () => {
    const res1 = validateSafeUrl("https://169.254.169.254/latest/meta-data");
    expect(res1.valid).toBe(false);
    expect(res1.error).toContain("Metadata");

    const res2 = validateSafeUrl("http://169.254.0.1/something");
    expect(res2.valid).toBe(false);
  });

  it("blocks private network subnets in production", () => {
    const originalEnv = (process.env as any).NODE_ENV;
    try {
      (process.env as any).NODE_ENV = "production";
      expect(validateSafeUrl("https://10.0.0.1/v1").valid).toBe(false);
      expect(validateSafeUrl("https://192.168.1.1/v1").valid).toBe(false);
      expect(validateSafeUrl("https://172.20.0.1/v1").valid).toBe(false);
      expect(validateSafeUrl("https://127.0.0.1:8080").valid).toBe(false);
      expect(validateSafeUrl("https://localhost:8080").valid).toBe(false);
      expect(validateSafeUrl("https://metadata.google.internal").valid).toBe(false);
    } finally {
      (process.env as any).NODE_ENV = originalEnv;
    }
  });

  it("rejects invalid URL formats", () => {
    expect(validateSafeUrl("not a url").valid).toBe(false);
    expect(validateSafeUrl("").valid).toBe(false);
  });
});
