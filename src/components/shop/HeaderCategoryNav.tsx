"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Cat = { id: number; name: string; slug: string };

type Props = {
  categories: Cat[];
  /** Ссылки на тёмном фоне шапки */
  dark?: boolean;
};

export function HeaderCategoryNav({ categories, dark = false }: Props) {
  const pathname = usePathname() ?? "";

  const catalogActive = pathname === "/catalog";
  const categorySlug =
    pathname.startsWith("/category/") ? pathname.slice("/category/".length).split("/")[0] : null;

  const linkBase =
    "shrink-0 snap-start cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm transition-colors duration-200";

  const focusRing = dark
    ? "focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand-teal/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
    : "focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand-teal/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

  if (dark) {
    return (
      <nav
        className="flex snap-x snap-mandatory gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden"
        aria-label="Категории"
      >
        <Link
          href="/catalog"
          className={`${linkBase} ${focusRing} ${
            catalogActive
              ? "border border-white/25 bg-white/10 font-semibold text-white shadow-sm"
              : "text-slate-400 hover:bg-white/10 hover:text-white"
          }`}
          aria-current={catalogActive ? "page" : undefined}
        >
          Каталог
        </Link>
        {categories.map((c) => {
          const active = categorySlug === c.slug;
          return (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className={`${linkBase} ${focusRing} ${
                active
                  ? "border border-white/25 bg-white/10 font-semibold text-white shadow-sm"
                  : "text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
              aria-current={active ? "page" : undefined}
            >
              {c.name}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      className="flex snap-x snap-mandatory gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden"
      aria-label="Категории"
    >
      <Link
        href="/catalog"
        className={`${linkBase} ${focusRing} ${
          catalogActive
            ? "border border-brand-border/80 bg-brand-elevated font-semibold text-brand-heading shadow-sm"
            : "text-brand-muted hover:bg-brand-elevated hover:text-brand-heading"
        }`}
        aria-current={catalogActive ? "page" : undefined}
      >
        Каталог
      </Link>
      {categories.map((c) => {
        const active = categorySlug === c.slug;
        return (
          <Link
            key={c.id}
            href={`/category/${c.slug}`}
            className={`${linkBase} ${focusRing} ${
              active
                ? "border border-brand-border/80 bg-brand-elevated font-semibold text-brand-heading shadow-sm"
                : "text-brand-muted hover:bg-brand-elevated hover:text-brand-heading"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {c.name}
          </Link>
        );
      })}
    </nav>
  );
}
