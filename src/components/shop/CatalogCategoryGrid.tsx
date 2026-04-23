"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";

export type CatalogCategoryItem = {
  id: number;
  name: string;
  slug: string;
  productCount: number;
  subcategories?: { id: number; name: string; slug: string; productCount: number }[];
};

function productCountLabel(n: number): string {
  if (n === 0) return "пока нет товаров";
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} товар`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} товара`;
  return `${n} товаров`;
}

const cardClass =
  "min-h-[5.5rem] rounded-xl border border-brand-border bg-brand-elevated shadow-sm transition-colors duration-200";
const cardInteractive =
  "hover:border-brand/25 hover:bg-brand-elevated/80 focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand-teal/50 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg";

const linkRowClass = `group flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-4 ${cardClass} ${cardInteractive}`;

const triggerButtonClass = `group flex w-full min-h-[5.5rem] cursor-pointer items-center justify-between gap-3 px-4 py-4 text-left text-inherit transition-colors duration-200 hover:bg-brand-elevated/80 focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand-teal/50 focus-visible:ring-inset`;

const subLinkClass =
  "block cursor-pointer rounded-md py-1.5 pl-3 text-sm text-brand-heading transition-colors duration-200 hover:bg-brand-elevated/80 focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand-teal/50 focus-visible:ring-inset";

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className={`h-5 w-5 shrink-0 text-brand-muted transition-transform duration-200 motion-reduce:transition-none ${
        open ? "rotate-180" : ""
      }`}
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0 text-brand-muted transition group-hover:translate-x-0.5 group-hover:text-brand"
      aria-hidden
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

/** База для сетки карточек (без верхнего отступа) */
export const catalogCategoryGridListClasses =
  "grid list-none items-start gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

type Props = {
  categories: CatalogCategoryItem[];
  /** Класс для <ul> (по умолчанию с верхним отступом, как в хабе каталога) */
  listClassName?: string;
};

export function CatalogCategoryGrid({ categories, listClassName }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const baseId = useId();
  const triggerRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  const close = useCallback(() => setExpandedId(null), []);

  useEffect(() => {
    if (expandedId == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      const id = expandedId;
      close();
      requestAnimationFrame(() => triggerRefs.current[id]?.focus());
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [expandedId, close]);

  return (
    <ul
      className={listClassName ?? `mt-10 ${catalogCategoryGridListClasses}`}
    >
      {categories.map((c) => {
        const subs = c.subcategories;
        if (!subs || subs.length === 0) {
          return (
            <li key={c.id} className="min-w-0 self-start">
              <Link href={`/category/${c.slug}`} className={linkRowClass}>
                <div className="min-w-0 text-left">
                  <span className="block text-base font-semibold text-brand-heading">
                    {c.name}
                  </span>
                  <span className="mt-0.5 block text-sm text-brand-muted">
                    {productCountLabel(c.productCount)}
                  </span>
                </div>
                <ChevronRight />
              </Link>
            </li>
          );
        }

        const open = expandedId === c.id;
        const panelId = `${baseId}-panel-${c.id}`;

        return (
          <li key={c.id} className="min-w-0 self-start">
            <div
              className={`w-full overflow-hidden rounded-xl border border-brand-border bg-brand-elevated shadow-sm transition-shadow duration-200 ${
                open ? "ring-1 ring-brand-border/50" : ""
              }`}
            >
              <button
                ref={(el) => {
                  triggerRefs.current[c.id] = el;
                }}
                type="button"
                className={triggerButtonClass}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setExpandedId((id) => (id === c.id ? null : c.id))}
              >
                <div className="min-w-0 text-left">
                  <span className="block text-base font-semibold text-brand-heading">
                    {c.name}
                  </span>
                  <span className="mt-0.5 block text-sm text-brand-muted">
                    {productCountLabel(c.productCount)}
                  </span>
                </div>
                <ChevronDown open={open} />
              </button>
              {open ? (
                <div
                  id={panelId}
                  className="max-h-48 overflow-y-auto border-t border-brand-border/60 bg-brand-elevated/50 px-2 py-2"
                  role="region"
                  aria-label={`Подкатегории: ${c.name}`}
                >
                  <Link
                    href={`/category/${c.slug}`}
                    className={`${subLinkClass} pl-2 font-medium`}
                    onClick={close}
                  >
                    Весь раздел
                    <span className="mt-0.5 block text-xs font-normal text-brand-muted">
                      {productCountLabel(c.productCount)}
                    </span>
                  </Link>
                  <ul className="ml-0 list-none space-y-0.5 border-l-2 border-brand-border/50 pl-2 pt-1">
                    {subs.map((s) => (
                      <li key={s.id}>
                        <Link
                          href={`/category/${s.slug}`}
                          className={subLinkClass}
                          onClick={close}
                        >
                          {s.name}
                          <span className="mt-0.5 block text-xs text-brand-muted">
                            {productCountLabel(s.productCount)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
