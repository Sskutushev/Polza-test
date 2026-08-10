import { z } from "zod";
import {
  normalizeCity,
  normalizeCount,
  normalizeName,
  normalizePhone,
  normalizeRating,
  normalizeWebsite
} from "./normalize.js";
import type { Issue } from "./result.js";

export const rawCompanySchema = z.record(z.unknown());

export type RawCompany = z.infer<typeof rawCompanySchema>;

export type CompanyInput = {
  sourceId: string | null;
  name: string;
  nameNorm: string;
  category: string | null;
  city: { name: string; slug: string } | null;
  address: string | null;
  rating: number | null;
  reviewsCount: number | null;
  website: string | null;
  websiteHost: string | null;
  phoneE164: string | null;
  phoneRaw: string | null;
  dedupKey: string;
  raw: RawCompany;
};

function pick(raw: RawCompany, names: string[]): unknown {
  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(raw, name)) return raw[name];
  }
  return null;
}

export function mapCompany(raw: RawCompany): { company: CompanyInput | null; issues: Issue[] } {
  const issues: Issue[] = [];
  const name = normalizeName(pick(raw, ["name", "title", "company", "company_name"]));
  issues.push(...name.issues);
  if (!name.value) return { company: null, issues };

  const city = normalizeCity(pick(raw, ["city", "town", "location"]));
  const rating = normalizeRating(pick(raw, ["rating", "rate", "stars"]));
  const reviewsCount = normalizeCount(pick(raw, ["reviews_count", "review_count", "reviews", "numReviews"]));
  const phone = normalizePhone(pick(raw, ["phone", "telephone", "tel"]));
  const website = normalizeWebsite(pick(raw, ["website", "site", "url"]));
  issues.push(...city.issues, ...rating.issues, ...reviewsCount.issues, ...phone.issues, ...website.issues);

  const category = pick(raw, ["category", "rubric", "type"]);
  const address = pick(raw, ["address", "addr"]);
  const sourceId = pick(raw, ["id", "source_id", "external_id"]);
  const dedupKey = makeDedupKey({
    phoneE164: phone.value?.e164 ?? null,
    websiteHost: website.value?.host ?? null,
    nameNorm: name.value.nameNorm,
    citySlug: city.value?.slug ?? null
  });

  return {
    company: {
      sourceId: sourceId == null ? null : String(sourceId),
      name: name.value.name,
      nameNorm: name.value.nameNorm,
      category: category == null ? null : String(category).trim() || null,
      city: city.value,
      address: address == null ? null : String(address).trim() || null,
      rating: rating.value,
      reviewsCount: reviewsCount.value,
      website: website.value?.url ?? null,
      websiteHost: website.value?.host ?? null,
      phoneE164: phone.value?.e164 ?? null,
      phoneRaw: phone.value?.raw ?? null,
      dedupKey,
      raw
    },
    issues
  };
}

export function makeDedupKey(input: { phoneE164: string | null; websiteHost: string | null; nameNorm: string; citySlug: string | null }): string {
  if (input.phoneE164) return `phone:${input.phoneE164}`;
  if (input.websiteHost) return `web:${input.websiteHost}`;
  return `name-city:${input.nameNorm}:${input.citySlug ?? "unknown"}`;
}
