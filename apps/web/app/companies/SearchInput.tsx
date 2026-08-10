"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export function SearchInput() {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");
  const [, startTransition] = useTransition();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(params);
      if (value) next.set("q", value);
      else next.delete("q");
      next.delete("page");
      startTransition(() =>
        router.replace(`/companies?${next.toString()}`, { scroll: false }),
      );
    }, 300);
    return () => window.clearTimeout(timer);
  }, [params, router, value]);

  return (
    <label>
      Поиск
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Название компании"
      />
    </label>
  );
}
