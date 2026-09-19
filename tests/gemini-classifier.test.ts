import { describe, it, expect } from "vitest";
import {
  classifyGeminiError,
  sanitizeError,
} from "../src/lib/ai/providers/gemini";

describe("Gemini Error Classification & Sanitization", () => {
  it("sanitizes Google API keys and bearer tokens from error strings", () => {
    const raw = "Request with key AIzaSyD1234567890abcdef1234567890abc failed with Bearer secret-token-xyz";
    const sanitized = sanitizeError(raw);

    expect(sanitized).not.toContain("AIzaSyD1234567890abcdef1234567890abc");
    expect(sanitized).toContain("AIza••••••••");
    expect(sanitized).not.toContain("secret-token-xyz");
    expect(sanitized).toContain("Bearer ••••••••");
  });

  it("classifies INVALID_API_KEY when Google returns API_KEY_INVALID (HTTP 400)", () => {
    const googleError = {
      status: 400,
      message: JSON.stringify({
        error: {
          code: 400,
          message: "API key not valid. Please pass a valid API key.",
          status: "INVALID_ARGUMENT",
          details: [
            {
              "@type": "type.googleapis.com/google.rpc.ErrorInfo",
              reason: "API_KEY_INVALID",
              domain: "googleapis.com",
            },
          ],
        },
      }),
    };

    const result = classifyGeminiError(googleError, "gemini-2.5-flash");
    expect(result.code).toBe("INVALID_API_KEY");
    expect(result.userMessage).toContain("Gemini API Key अवैध");
    expect(result.safeDetails).toContain("API_KEY_INVALID (HTTP 400)");
  });

  it("classifies PERMISSION_DENIED when caller has no permission or is unregistered (HTTP 403)", () => {
    const googleError = {
      status: 403,
      message: JSON.stringify({
        error: {
          code: 403,
          message: "Method doesn't allow unregistered callers.",
          status: "PERMISSION_DENIED",
        },
      }),
    };

    const result = classifyGeminiError(googleError, "gemini-2.5-flash");
    expect(result.code).toBe("PERMISSION_DENIED");
    expect(result.userMessage).toContain("परवानगी नाकारली");
    expect(result.safeDetails).toContain("PERMISSION_DENIED (HTTP 403)");
  });

  it("classifies API_DISABLED when Generative Language API is disabled in project", () => {
    const googleError = {
      status: 403,
      message: JSON.stringify({
        error: {
          code: 403,
          message: "Generative Language API has not been used in project 123456789 before or it is disabled.",
          status: "PERMISSION_DENIED",
          details: [{ reason: "SERVICE_DISABLED" }],
        },
      }),
    };

    const result = classifyGeminiError(googleError, "gemini-2.5-flash");
    expect(result.code).toBe("API_DISABLED");
    expect(result.userMessage).toContain("API सक्षम केलेले नाही");
    expect(result.safeDetails).toContain("SERVICE_DISABLED");
  });

  it("classifies QUOTA_EXCEEDED on rate limit or resource exhaustion (HTTP 429)", () => {
    const googleError = {
      status: 429,
      message: JSON.stringify({
        error: {
          code: 429,
          message: "Resource has been exhausted (e.g. check quota).",
          status: "RESOURCE_EXHAUSTED",
        },
      }),
    };

    const result = classifyGeminiError(googleError, "gemini-2.5-flash");
    expect(result.code).toBe("QUOTA_EXCEEDED");
    expect(result.userMessage).toContain("कोटा किंवा विनंती मर्यादा");
    expect(result.safeDetails).toContain("RESOURCE_EXHAUSTED (HTTP 429)");
  });

  it("classifies MODEL_NOT_FOUND when model is invalid or deprecated (HTTP 404)", () => {
    const googleError = {
      status: 404,
      message: JSON.stringify({
        error: {
          code: 404,
          message: "models/gemini-unsupported-model is not found for API version v1beta",
          status: "NOT_FOUND",
        },
      }),
    };

    const result = classifyGeminiError(googleError, "gemini-unsupported-model");
    expect(result.code).toBe("MODEL_NOT_FOUND");
    expect(result.userMessage).toContain("'gemini-unsupported-model' हे Gemini मॉडेल उपलब्ध नाही");
    expect(result.safeDetails).toContain("MODEL_NOT_FOUND (HTTP 404)");
  });

  it("classifies NETWORK_ERROR on DNS or socket connection failure", () => {
    const netErr = new Error("fetch failed: ENOTFOUND generativelanguage.googleapis.com");
    const result = classifyGeminiError(netErr, "gemini-2.5-flash");

    expect(result.code).toBe("NETWORK_ERROR");
    expect(result.userMessage).toContain("Google सर्व्हरशी नेटवर्क कनेक्शन");
    expect(result.safeDetails).toContain("Network connection to Google Gemini API failed");
  });

  it("classifies INVALID_REQUEST on general invalid argument (HTTP 400)", () => {
    const badReqError = {
      status: 400,
      message: JSON.stringify({
        error: {
          code: 400,
          message: "Invalid JSON payload received. Unexpected token.",
          status: "INVALID_ARGUMENT",
        },
      }),
    };

    const result = classifyGeminiError(badReqError, "gemini-2.5-flash");
    expect(result.code).toBe("INVALID_REQUEST");
    expect(result.userMessage).toContain("Gemini API विनंती अवैध");
  });

  it("classifies SDK_CONFIGURATION_ERROR when error is null or unrecognized", () => {
    const result = classifyGeminiError(null);
    expect(result.code).toBe("SDK_CONFIGURATION_ERROR");
  });
});

