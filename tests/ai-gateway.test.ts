import { describe, it, expect } from "vitest";
import { encryptApiKey, decryptApiKey, maskApiKey } from "../src/lib/ai/encryption";
import { generateDeterministicNewsroomOutput } from "../src/lib/ai/fallback-generator";
import { AIArticleStudioOutputSchema } from "../src/schemas/ai.schema";
import { aiGateway } from "../src/lib/ai/gateway";

describe("AI Gateway & AES-256-GCM Key Encryption", () => {
  it("encrypts and decrypts API keys correctly using AES-256-GCM", () => {
    const rawKey = "sk-proj-abc123xyz789SECRETKEY0000";
    const encrypted = encryptApiKey(rawKey);

    // Format should be iv:tag:ciphertext (3 parts)
    expect(encrypted).toContain(":");
    const parts = encrypted.split(":");
    expect(parts.length).toBe(3);
    expect(parts[0].length).toBe(32); // 16 bytes IV in hex
    expect(parts[1].length).toBe(32); // 16 bytes Auth Tag in hex

    // Decryption must match exactly
    const decrypted = decryptApiKey(encrypted);
    expect(decrypted).toBe(rawKey);
  });

  it("masks API keys safely without revealing secrets", () => {
    expect(maskApiKey("AIzaSyB3124890abcDEF")).toBe("••••••••cDEF");
    expect(maskApiKey("sk-1234567890abcd")).toBe("••••••••abcd");
    expect(maskApiKey("1234")).toBe("••••••••");
    expect(maskApiKey("")).toBe("••••••••");
  });

  it("guarantees deterministic newsroom output conforms to schema", () => {
    const output = generateDeterministicNewsroomOutput({
      notes: "जामखेड कृषी उत्पन्न बाजार समितीत आज २५ हजार गोण्या कांद्याची आवक. २८०० रुपये प्रतिक्विंटल भाव मिळाला.",
      location: "जामखेड",
      language: "marathi",
      action: "GENERATE_ARTICLE",
    });

    const parsed = AIArticleStudioOutputSchema.safeParse(output);
    expect(parsed.success).toBe(true);
    expect(output.headline).toContain("जामखेड");
    expect(output.key_takeaways.length).toBeGreaterThanOrEqual(2);
    expect(output.seo.slug).toContain("awaaz-jamkhed");
    expect(output.social.whatsapp_message).toContain("https://awaazjamkhed.com/news/");
  });

  it("handles AI Gateway generate with fallback safely", async () => {
    const result = await aiGateway.generate({
      notes: "खर्डा रोडवरील नवीन पाणी पुरवठा पाईपलाईनचे काम पूर्ण.",
      location: "खर्डा",
      language: "marathi",
      action: "GENERATE_ARTICLE",
    });

    expect(result).toBeDefined();
    expect(result.output).toBeDefined();
    expect(result.output.headline).toContain("खर्डा");
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("executes targeted actions via executeAction properly", async () => {
    const res = await aiGateway.executeAction("GENERATE_BREAKING_HEADLINE", {
      notes: "जामखेड नगरपरिषद निवडणुकीची आचारसंहिता जाहीर.",
      location: "जामखेड",
      language: "marathi",
      action: "GENERATE_BREAKING_HEADLINE",
    });

    expect(res.headline).toContain("🚨 ब्रेकिंग:");
    expect(res.resultText).toContain("🚨 ब्रेकिंग:");
  });
});

