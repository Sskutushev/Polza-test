import { describe, expect, it } from "vitest";
import { messages, parseLang } from "../../apps/web/app/companies/i18n";

describe("i18n", () => {
  it("keeps all locales structurally aligned", () => {
    const ruKeys = Object.keys(messages.ru).sort();
    expect(Object.keys(messages.en).sort()).toEqual(ruKeys);
    expect(Object.keys(messages.zh).sort()).toEqual(ruKeys);
  });

  it("falls back to russian for unknown locale", () => {
    expect(parseLang("en")).toBe("en");
    expect(parseLang("zh")).toBe("zh");
    expect(parseLang("unknown")).toBe("ru");
  });
});
