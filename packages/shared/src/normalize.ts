import { fail, ok, type Parsed } from "./result.js";

const emptyTokens = new Set(["", "-", "—", "n/a", "na", "null", "none", "нет"]);
const roleLocalParts = new Set(["info", "admin", "support", "sales", "office", "noreply", "no-reply", "contact"]);
const reservedDomains = new Set(["example.com", "example.org", "example.net", "test", "localhost", "invalid"]);
const disposableDomains = new Set(["mailinator.com", "guerrillamail.com", "10minutemail.com", "temp-mail.org"]);

export type NormalizedPhone = { e164: string; raw: string; ext?: string };
export type NormalizedWebsite = { url: string; host: string; isSocial: boolean };
export type NormalizedEmail = {
  normalized: string;
  comparable: string;
  status: "valid" | "risky" | "invalid";
  codes: string[];
};

export function cleanText(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  const value = String(raw)
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (emptyTokens.has(value.toLowerCase())) return null;
  return value;
}

export function normalizeName(raw: unknown): Parsed<{ name: string; nameNorm: string }> {
  const name = cleanText(raw);
  if (!name) {
    return fail({
      code: "REQUIRED_MISSING",
      severity: "error",
      field: "name",
      rawValue: raw,
      message: "Company name is required"
    });
  }
  const nameNorm = name
    .toLowerCase()
    .replace(/["'«»]/g, "")
    .replace(/^(ооо|ип|зао|оао|пао)\s+/gi, "")
    .replace(/\s+(llc|ltd|inc)$/gi, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return ok({ name, nameNorm });
}

export function normalizeCity(raw: unknown): Parsed<{ name: string; slug: string } | null> {
  const value = cleanText(raw);
  if (!value) return ok(null);
  const aliases = new Map([
    ["спб", "Санкт-Петербург"],
    ["питер", "Санкт-Петербург"],
    ["санкт петербург", "Санкт-Петербург"],
    ["мск", "Москва"]
  ]);
  const key = value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const name = aliases.get(key) ?? value;
  return ok({ name, slug: slugify(name) });
}

export function normalizeRating(raw: unknown, max = 5): Parsed<number | null> {
  const value = cleanText(raw);
  if (!value) return ok(null);
  const parsed = Number(value.replace(",", "."));
  if (!Number.isFinite(parsed)) {
    return fail({ code: "RATING_INVALID", severity: "warning", field: "rating", rawValue: raw, message: "Rating is not numeric" });
  }
  if (parsed < 0 || parsed > max) {
    return fail({ code: "RATING_OUT_OF_RANGE", severity: "warning", field: "rating", rawValue: raw, message: `Rating is outside 0..${max}` });
  }
  return ok(Math.round(parsed * 10) / 10);
}

export function normalizeCount(raw: unknown): Parsed<number | null> {
  const value = cleanText(raw);
  if (!value) return ok(null);
  const parsed = Number.parseInt(value.replace(/\s/g, ""), 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return fail({ code: "COUNT_INVALID", severity: "warning", field: "count", rawValue: raw, message: "Expected non-negative integer" });
  }
  return ok(parsed);
}

export function normalizePhone(raw: unknown): Parsed<NormalizedPhone | null> {
  const value = cleanText(raw);
  if (!value) return ok(null);
  const extMatch = value.match(/(?:доб\.?|ext\.?)\s*(\d+)/i);
  const digits = value.replace(/[^\d+]/g, "");
  let normalized = digits;
  if (/^8\d{10}$/.test(normalized)) normalized = `+7${normalized.slice(1)}`;
  if (/^7\d{10}$/.test(normalized)) normalized = `+${normalized}`;
  if (!/^\+\d{10,15}$/.test(normalized)) {
    return fail({ code: "PHONE_UNPARSEABLE", severity: "warning", field: "phone", rawValue: raw, message: "Phone cannot be normalized to E.164" });
  }
  return ok({ e164: normalized, raw: value, ...(extMatch?.[1] ? { ext: extMatch[1] } : {}) });
}

export function normalizeWebsite(raw: unknown): Parsed<NormalizedWebsite | null> {
  const value = cleanText(raw);
  if (!value) return ok(null);
  try {
    const url = new URL(/^[a-z]+:\/\//i.test(value) ? value : `https://${value}`);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const isSocial = /(?:vk\.com|facebook\.com|instagram\.com|t\.me)$/.test(host);
    return ok({ url: url.toString(), host, isSocial });
  } catch {
    return fail({ code: "WEBSITE_NOT_A_URL", severity: "warning", field: "website", rawValue: raw, message: "Website cannot be parsed as URL" });
  }
}

export function normalizeEmail(raw: unknown): Parsed<NormalizedEmail | null> {
  const value = cleanText(raw);
  if (!value) return ok(null);
  const normalized = value.toLowerCase();
  const match = normalized.match(/^([^@\s]+)@([^@\s]+\.[^@\s]+)$/);
  if (!match) {
    return fail({ code: "EMAIL_SYNTAX_INVALID", severity: "error", field: "email", rawValue: raw, message: "Invalid email syntax" });
  }
  const local = match[1] ?? "";
  const domain = match[2] ?? "";
  const codes: string[] = [];
  if (reservedDomains.has(domain)) codes.push("EMAIL_RESERVED_DOMAIN");
  if (disposableDomains.has(domain)) codes.push("EMAIL_DISPOSABLE");
  if (roleLocalParts.has(local.split("+")[0] ?? local)) codes.push("EMAIL_ROLE_BASED");
  const comparable = `${local.replace(/\+.*/, "")}@${domain}`;
  const status = codes.some((code) => code !== "EMAIL_ROLE_BASED") ? "invalid" : codes.length > 0 ? "risky" : "valid";
  return ok({ normalized, comparable, status, codes });
}

export function slugify(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}
