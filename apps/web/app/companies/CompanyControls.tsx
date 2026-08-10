"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { CompanyFacet } from "@polza/db/companies";
import type { Lang, Messages } from "./i18n";

type CompanyControlsProps = {
  cities: CompanyFacet[];
  categories: CompanyFacet[];
  lang: Lang;
  messages: Messages;
};

const languages: Array<{ value: Lang; label: string }> = [
  { value: "ru", label: "RU" },
  { value: "en", label: "EN" },
  { value: "zh", label: "中文" },
];

export function CompanyControls({
  cities,
  categories,
  lang,
  messages,
}: CompanyControlsProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [, startTransition] = useTransition();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      updateParams("q", query);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const selected = useMemo(
    () => ({
      city: params.get("city") ?? "",
      category: params.get("category") ?? "",
      sort: params.get("sort") ?? "name",
      lang,
    }),
    [lang, params],
  );

  function updateParams(key: string, value: string): void {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    startTransition(() =>
      router.replace(`/companies?${next.toString()}`, { scroll: false }),
    );
  }

  return (
    <section className="control-panel" aria-label={messages.filters}>
      <label className="search-field">
        <span>{messages.search}</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={messages.searchPlaceholder}
        />
      </label>

      <label>
        <span>{messages.city}</span>
        <select
          value={selected.city}
          onChange={(event) => updateParams("city", event.target.value)}
        >
          <option value="">{messages.allCities}</option>
          {cities.map((city) => (
            <option key={city.slug} value={city.slug}>
              {city.name} · {city.count}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>{messages.category}</span>
        <select
          value={selected.category}
          onChange={(event) => updateParams("category", event.target.value)}
        >
          <option value="">{messages.allCategories}</option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name} · {category.count}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>{messages.sort}</span>
        <select
          value={selected.sort}
          onChange={(event) => updateParams("sort", event.target.value)}
        >
          <option value="name">{messages.sortName}</option>
          <option value="rating">{messages.sortRating}</option>
          <option value="reviews">{messages.sortReviews}</option>
        </select>
      </label>

      <label>
        <span>{messages.lang}</span>
        <select
          value={selected.lang}
          onChange={(event) => updateParams("lang", event.target.value)}
        >
          {languages.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <button
        className="ghost-button"
        type="button"
        onClick={() => router.replace(`/companies?lang=${lang}`)}
      >
        {messages.reset}
      </button>
    </section>
  );
}
