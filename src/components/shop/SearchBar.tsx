"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { childrenOf, partitionRootsAndChildren, type CategoryRecord } from "@/lib/categories";

type Category = { id: number; name: string; slug: string; parentId?: number | null };

type Props = {
  categories: Category[];
  /** Поле поиска в тёмной шапке */
  inHeaderDark?: boolean;
};

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className={`shrink-0 transition-transform duration-200 motion-reduce:transition-none ${
        open ? "rotate-180" : ""
      }`}
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function SearchBar({ categories, inHeaderDark = false }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [expandedRootId, setExpandedRootId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(params.get("q") ?? "");
    setCategory(params.get("category") ?? "");
  }, [params]);

  const { roots, hasSubs, slugToName } = useMemo(() => {
    const rows = categories as CategoryRecord[];
    const subs = rows.some((c) => c.parentId != null);
    if (!subs) {
      const map = new Map<string, string>();
      for (const c of rows) map.set(c.slug, c.name);
      return { roots: rows, hasSubs: false, slugToName: map };
    }
    const { roots: r } = partitionRootsAndChildren(rows);
    const map = new Map<string, string>();
    for (const c of rows) map.set(c.slug, c.name);
    return { roots: r, hasSubs: true, slugToName: map };
  }, [categories]);

  const currentLabel = category ? slugToName.get(category) ?? category : "Все категории";

  const close = useCallback(() => {
    setPickerOpen(false);
  }, []);

  const selectCategory = useCallback(
    (slug: string) => {
      setCategory(slug);
      setPickerOpen(false);
      setExpandedRootId(null);
    },
    [],
  );

  useEffect(() => {
    if (!pickerOpen) return;
    if (!hasSubs) {
      setExpandedRootId(null);
    } else {
      const rows = categories as CategoryRecord[];
      if (!category) {
        setExpandedRootId(null);
      } else {
        const { roots: r } = partitionRootsAndChildren(rows);
        let found: number | null = null;
        for (const root of r) {
          const subs = childrenOf(root.id, rows);
          if (subs.length === 0) continue;
          if (category === root.slug || subs.some((s) => s.slug === category)) {
            found = root.id;
            break;
          }
        }
        setExpandedRootId(found);
      }
    }
  }, [pickerOpen, category, hasSubs, categories]);

  useEffect(() => {
    if (!pickerOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [pickerOpen, close]);

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

  const triggerClass = inHeaderDark
    ? "flex w-full min-h-[2.75rem] cursor-pointer items-center justify-between gap-1 border-b border-white/10 bg-transparent py-2.5 pl-3 pr-2 text-left text-sm text-slate-200 outline-none transition-colors duration-200 hover:text-white focus-visible:ring-2 focus-visible:ring-brand-teal/50 sm:min-h-0 sm:max-w-[min(100%,11rem)] sm:shrink-0 sm:border-b-0 sm:border-r sm:border-white/10"
    : "flex w-full min-h-[2.75rem] cursor-pointer items-center justify-between gap-1 border-b border-brand-border bg-transparent py-2.5 pl-3 pr-2 text-left text-sm text-brand-muted outline-none transition-colors duration-200 hover:text-brand-heading focus-visible:ring-2 focus-visible:ring-brand-teal/50 sm:min-h-0 sm:max-w-[min(100%,11rem)] sm:shrink-0 sm:border-b-0 sm:border-r sm:border-brand-border";

  const inputClass = inHeaderDark
    ? "min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none"
    : "min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-brand-heading placeholder:text-brand-muted/60 outline-none";

  const btnClass = inHeaderDark
    ? "flex shrink-0 items-center px-3 text-slate-400 transition hover:text-brand-teal"
    : "flex shrink-0 items-center px-3 text-brand-muted transition hover:text-brand-teal";

  const panelClass = inHeaderDark
    ? "mt-1 max-h-[min(18rem,50vh)] overflow-y-auto rounded-lg border border-white/15 bg-slate-900 py-1 shadow-lg shadow-black/30"
    : "mt-1 max-h-[min(18rem,50vh)] overflow-y-auto rounded-lg border border-brand-border bg-brand-elevated py-1 shadow-lg";

  const rowBase = inHeaderDark
    ? "w-full cursor-pointer rounded-md px-3 py-2.5 text-left text-sm text-slate-200 transition-colors duration-200 hover:bg-white/10"
    : "w-full cursor-pointer rounded-md px-3 py-2.5 text-left text-sm text-brand-heading transition-colors duration-200 hover:bg-brand-elevated";

  const subRowBase = inHeaderDark
    ? "w-full cursor-pointer rounded-md py-1.5 pl-6 pr-2 text-left text-sm text-slate-300 transition-colors duration-200 hover:bg-white/10"
    : "w-full cursor-pointer rounded-md py-1.5 pl-6 pr-2 text-left text-sm text-brand-heading transition-colors duration-200 hover:bg-brand-elevated";

  return (
    <form
      onSubmit={submit}
      className={`flex w-full max-w-none flex-col rounded-xl border transition sm:max-w-xl sm:flex-row ${shell}`}
    >
      <div ref={containerRef} className="relative w-full min-w-0 sm:max-w-[min(100%,11rem)] sm:shrink-0">
        <button
          ref={triggerRef}
          type="button"
          className={triggerClass}
          aria-haspopup="listbox"
          aria-expanded={pickerOpen}
          aria-controls={panelId}
          onClick={() => {
            setPickerOpen((o) => !o);
          }}
        >
          <span className="min-w-0 truncate">{currentLabel}</span>
          <Chevron open={pickerOpen} />
        </button>

        {pickerOpen ? (
          <div
            id={panelId}
            role="listbox"
            aria-label="Категория поиска"
            className={`absolute left-0 right-0 z-50 sm:left-0 sm:right-0 ${panelClass}`}
          >
            <button
              type="button"
              role="option"
              aria-selected={!category}
              className={rowBase}
              onClick={() => selectCategory("")}
            >
              Все категории
            </button>

            {!hasSubs
              ? roots.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    role="option"
                    aria-selected={category === c.slug}
                    className={rowBase}
                    onClick={() => selectCategory(c.slug)}
                  >
                    {c.name}
                  </button>
                ))
              : roots.map((root) => {
                  const subs = childrenOf(root.id, categories as CategoryRecord[]);
                  if (subs.length === 0) {
                    return (
                      <button
                        key={root.id}
                        type="button"
                        role="option"
                        aria-selected={category === root.slug}
                        className={rowBase}
                        onClick={() => selectCategory(root.slug)}
                      >
                        {root.name}
                      </button>
                    );
                  }
                  const expanded = expandedRootId === root.id;
                  return (
                    <div
                      key={root.id}
                      className={
                        inHeaderDark
                          ? "border-b border-white/10 last:border-b-0"
                          : "border-b border-brand-border/60 last:border-b-0"
                      }
                    >
                      <button
                        type="button"
                        className={`${rowBase} flex items-center justify-between font-medium`}
                        aria-expanded={expanded}
                        onClick={() =>
                          setExpandedRootId((id) => (id === root.id ? null : root.id))
                        }
                      >
                        <span className="min-w-0 truncate">{root.name}</span>
                        <Chevron open={expanded} />
                      </button>
                      {expanded ? (
                        <div className="pb-1" role="group" aria-label={root.name}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={category === root.slug}
                            className={subRowBase}
                            onClick={() => selectCategory(root.slug)}
                          >
                            Весь раздел
                          </button>
                          {subs.map((ch) => (
                            <button
                              key={ch.id}
                              type="button"
                              role="option"
                              aria-selected={category === ch.slug}
                              className={subRowBase}
                              onClick={() => selectCategory(ch.slug)}
                            >
                              {ch.name}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
          </div>
        ) : null}
      </div>

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
