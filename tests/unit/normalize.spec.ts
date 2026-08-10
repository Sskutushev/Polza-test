import { describe, expect, it } from "vitest";
import { normalizeEmail, normalizeName, normalizePhone, normalizeRating, normalizeWebsite } from "@polza/shared";

describe("normalizers", () => {
  it("normalizes company names", () => {
    const result = normalizeName(" ООО «Ромашка» ");
    expect(result.value?.name).toBe("ООО «Ромашка»");
    expect(result.value?.nameNorm).toBe("ромашка");
  });

  it("parses comma ratings", () => {
    expect(normalizeRating("4,5").value).toBe(4.5);
    expect(normalizeRating("8").issues[0]?.code).toBe("RATING_OUT_OF_RANGE");
  });

  it("normalizes russian phone values", () => {
    expect(normalizePhone("8 (913) 506-52-60").value?.e164).toBe("+79135065260");
  });

  it("normalizes websites", () => {
    expect(normalizeWebsite("www.example.com/path").value?.host).toBe("example.com");
  });

  it("returns email reason codes", () => {
    expect(normalizeEmail("info@mailinator.com").value?.codes).toContain("EMAIL_DISPOSABLE");
    expect(normalizeEmail("bad@").issues[0]?.code).toBe("EMAIL_SYNTAX_INVALID");
  });
});
