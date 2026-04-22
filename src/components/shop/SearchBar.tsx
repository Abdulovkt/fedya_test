"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Category = { id: number; name: string; slug: string };

type Props = {
  categories: Category[];
  /** Поле поиска в тёмной шапке */
  inHeaderDark?: boolean;
};

export function SearchBar({ categories, inHeaderDark = false }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const [query, setQuery] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(params.get("q") ?? "");
    setCategory(params.get("category") ?? "");
  }, [params]);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const qs = new URLSearchParams();
    if (query.trim()) qs.set("q", query.trim());
    if (category) qs.set("category", category);
    router.push(`/catalog${qs.size ? `?${qs}` : ""}`);
  }

  const shell = inHeaderDark
    ? "border-white/15 bg-white/10 shadow-none backdrop-blur-sm focus-within:border-brand-teal/70 focus-within:ring-2 focus-within:ring-brand-teal/40"
    : "border-brand-border bg-brand-elevated shadow-sm focus-within:border-brand-teal focus-within:ring-1 focus-within:ring-brand-teal";

  const selectClass = inHeaderDark
    ? "w-full cursor-pointer border-b border-white/10 bg-transparent py-2.5 pl-3 pr-2 text-sm text-slate-200 outline-none hover:text-white sm:max-w-[min(100%,11rem)] sm:shrink-0 sm:border-b-0 sm:border-r sm:border-white/10"
    : "w-full cursor-pointer border-b border-brand-border bg-transparent py-2.5 pl-3 pr-2 text-sm text-brand-muted outline-none hover:text-brand-heading sm:max-w-[min(100%,11rem)] sm:shrink-0 sm:border-b-0 sm:border-r";

  const inputClass = inHeaderDark
    ? "min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none"
    : "min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-brand-heading placeholder:text-brand-muted/60 outline-none";

  const btnClass = inHeaderDark
    ? "flex shrink-0 items-center px-3 text-slate-400 transition hover:text-brand-teal"
    : "flex shrink-0 items-center px-3 text-brand-muted transition hover:text-brand-teal";

  return (
    <form
      onSubmit={submit}
      className={`flex w-full max-w-none flex-col overflow-hidden rounded-xl border transition ${shell} sm:max-w-xl sm:flex-row`}
    >
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className={selectClass}
      >
        <option value="">Все категории</option>
        {categories.map((c) => (
          <option key={c.id} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>

      <div className="flex min-w-0 flex-1">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск..."
          className={inputClass}
        />

        <button type="submit" aria-label="Найти" className={btnClass}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </div>
    </form>
  );
}
