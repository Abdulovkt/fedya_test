"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { childrenOf, type CategoryRecord } from "@/lib/categories";

type Cat = { id: number; name: string; slug: string; parentId: number | null };

type Props = {
  /** Корневые категории (как и раньше) */
  categories: Cat[];
  /** Все категории — для вложенных ссылок в flyout */
  allCategories: Cat[];
  /** Ссылки на тёмном фоне шапки */
  dark?: boolean;
};

function Chevron({ open, className }: { open: boolean; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className={`shrink-0 transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""} ${className ?? ""}`}
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function HeaderCategoryNav({ categories, allCategories, dark = false }: Props) {
  const pathname = usePathname() ?? "";
  const [openRootId, setOpenRootId] = useState<number | null>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const [panel, setPanel] = useState({ top: 0, left: 0, minWidth: 192 });

  const all = allCategories as CategoryRecord[];

  const catalogActive = pathname === "/catalog";
  const categorySlug =
    pathname.startsWith("/category/") ? pathname.slice("/category/".length).split("/")[0] : null;

  const linkBase =
    "inline-flex min-h-0 shrink-0 snap-start cursor-pointer items-center gap-0.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm transition-colors duration-200";

  const focusRing = dark
    ? "focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand-teal/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
    : "focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand-teal/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

  const catalogClass = (active: boolean) =>
    `${linkBase} ${focusRing} ${
      active
        ? dark
          ? "border border-white/25 bg-white/10 font-semibold text-white shadow-sm"
          : "border border-brand-border/80 bg-brand-elevated font-semibold text-brand-heading shadow-sm"
        : dark
          ? "text-slate-400 hover:bg-white/10 hover:text-white"
          : "text-brand-muted hover:bg-brand-elevated hover:text-brand-heading"
    }`;

  const flyoutClass = dark
    ? "z-[100] max-h-[min(20rem,70vh)] overflow-y-auto rounded-lg border border-white/15 bg-slate-900 py-1 shadow-lg shadow-black/30"
    : "z-[100] max-h-[min(20rem,70vh)] overflow-y-auto rounded-lg border border-brand-border bg-brand-elevated py-1 shadow-lg";

  const flyoutLink = dark
    ? "block w-full cursor-pointer rounded-md px-3 py-2.5 text-left text-sm text-slate-200 transition-colors duration-200 hover:bg-white/10"
    : "block w-full cursor-pointer rounded-md px-3 py-2.5 text-left text-sm text-brand-heading transition-colors duration-200 hover:bg-brand-elevated";

  const flyoutLinkActive = dark ? "bg-white/10 font-semibold text-white" : "font-semibold text-brand-heading";

  const updatePanel = useCallback((rootId: number) => {
    const el = triggerRefs.current[rootId];
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = typeof window !== "undefined" ? window.innerWidth : 1000;
    const left = Math.min(r.left, Math.max(8, vw - 12 * 16 - 8));
    setPanel({
      top: r.bottom + 4,
      left,
      minWidth: Math.max(192, r.width),
    });
  }, []);

  useLayoutEffect(() => {
    if (openRootId == null) return;
    updatePanel(openRootId);
    const onScroll = () => updatePanel(openRootId);
    const onResize = () => updatePanel(openRootId);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [openRootId, updatePanel]);

  useEffect(() => {
    if (openRootId == null) return;
    const id = openRootId;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      const trig = triggerRefs.current[id];
      if (trig?.contains(t) || flyoutRef.current?.contains(t)) return;
      setOpenRootId(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenRootId(null);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [openRootId]);

  useEffect(() => {
    setOpenRootId(null);
  }, [pathname]);

  return (
    <nav
      className="flex snap-x snap-mandatory gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden"
      aria-label="Категории"
    >
      <Link
        href="/catalog"
        className={catalogClass(catalogActive)}
        aria-current={catalogActive ? "page" : undefined}
      >
        Каталог
      </Link>
      {categories.map((c) => {
        const subs = childrenOf(c.id, all);
        if (subs.length === 0) {
          const active = categorySlug === c.slug;
          return (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className={`${linkBase} ${focusRing} ${
                active
                  ? dark
                    ? "border border-white/25 bg-white/10 font-semibold text-white shadow-sm"
                    : "border border-brand-border/80 bg-brand-elevated font-semibold text-brand-heading shadow-sm"
                  : dark
                    ? "text-slate-400 hover:bg-white/10 hover:text-white"
                    : "text-brand-muted hover:bg-brand-elevated hover:text-brand-heading"
              }`}
              aria-current={active ? "page" : undefined}
            >
              {c.name}
            </Link>
          );
        }

        const branchActive =
          categorySlug === c.slug || subs.some((s) => s.slug === categorySlug);
        const open = openRootId === c.id;

        return (
          <div key={c.id} className="shrink-0 snap-start">
            <button
              type="button"
              ref={(el) => {
                triggerRefs.current[c.id] = el;
              }}
              className={`${linkBase} ${focusRing} ${
                branchActive || open
                  ? dark
                    ? "border border-white/25 bg-white/10 font-semibold text-white shadow-sm"
                    : "border border-brand-border/80 bg-brand-elevated font-semibold text-brand-heading shadow-sm"
                  : dark
                    ? "text-slate-400 hover:bg-white/10 hover:text-white"
                    : "text-brand-muted hover:bg-brand-elevated hover:text-brand-heading"
              }`}
              aria-expanded={open}
              aria-haspopup="menu"
              aria-label={`${c.name}, подменю категорий`}
              onClick={() => setOpenRootId((id) => (id === c.id ? null : c.id))}
            >
              {c.name}
              <Chevron
                open={open}
                className={dark ? "text-slate-400" : "text-brand-muted"}
              />
            </button>
            {open && typeof document !== "undefined"
              ? createPortal(
                  <div
                    ref={flyoutRef}
                    className={flyoutClass}
                    style={{
                      position: "fixed",
                      top: panel.top,
                      left: panel.left,
                      minWidth: panel.minWidth,
                    }}
                    role="menu"
                    aria-label={c.name}
                  >
                    <Link
                      href={`/category/${c.slug}`}
                      className={`${flyoutLink} ${
                        categorySlug === c.slug ? flyoutLinkActive : ""
                      }`}
                      role="menuitem"
                      onClick={() => setOpenRootId(null)}
                    >
                      Весь раздел
                    </Link>
                    {subs.map((ch) => {
                      const a = categorySlug === ch.slug;
                      return (
                        <Link
                          key={ch.id}
                          href={`/category/${ch.slug}`}
                          className={`${flyoutLink} ${a ? flyoutLinkActive : ""}`}
                          role="menuitem"
                          onClick={() => setOpenRootId(null)}
                        >
                          {ch.name}
                        </Link>
                      );
                    })}
                  </div>,
                  document.body,
                )
              : null}
          </div>
        );
      })}
    </nav>
  );
}
