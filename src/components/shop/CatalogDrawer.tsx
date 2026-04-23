"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type Cat = { id: number; name: string; slug: string };

const overlayTransition =
  "transition-opacity duration-200 ease-out motion-reduce:duration-0 motion-reduce:transition-none";
const panelTransition =
  "transition-transform duration-200 ease-out motion-reduce:duration-0 motion-reduce:transition-none";

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  const sel =
    'a[href], button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll<HTMLElement>(sel)).filter(
    (el) => !el.hasAttribute("hidden") && el.getAttribute("aria-hidden") !== "true",
  );
}

type Props = {
  categories: Cat[];
  /** Стили под тёмную шапку (как в HeaderCategoryNav) */
  dark?: boolean;
};

export function CatalogDrawer({ categories, dark = false }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "";
  const titleId = useId();
  const panelId = useId();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  const categorySlug =
    pathname.startsWith("/category/") ? pathname.slice("/category/".length).split("/")[0] : null;
  const catalogActive = pathname === "/catalog";

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (open) {
      prevFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      if (prevFocusRef.current && typeof prevFocusRef.current.focus === "function") {
        prevFocusRef.current.focus();
        prevFocusRef.current = null;
      }
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = requestAnimationFrame(() => closeBtnRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDocKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener("keydown", onDocKeyDown);
    return () => document.removeEventListener("keydown", onDocKeyDown);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const onPanelKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusables = getFocusableElements(panel);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    panel.addEventListener("keydown", onPanelKeyDown);
    return () => panel.removeEventListener("keydown", onPanelKeyDown);
  }, [open]);

  const triggerClass = dark
    ? "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-sm font-medium text-white shadow-sm transition-colors duration-200 cursor-pointer hover:bg-white/10 focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand-teal/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 sm:w-auto"
    : "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-brand-border bg-brand-elevated px-3 py-2.5 text-sm font-medium text-brand-heading shadow-sm transition-colors duration-200 cursor-pointer hover:border-brand/30 focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand-teal/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:w-auto";

  const itemInactive = dark
    ? "text-slate-300 hover:bg-white/10 hover:text-white"
    : "text-brand-muted hover:bg-brand-elevated hover:text-brand-heading";
  const itemActive = dark
    ? "bg-white/10 font-semibold text-white"
    : "bg-brand-elevated font-semibold text-brand-heading";

  return (
    <div>
      <button
        type="button"
        id={`${panelId}-trigger`}
        className={triggerClass}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Закрыть меню каталога" : "Открыть меню каталога"}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="inline-block h-5 w-5" aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="h-5 w-5"
          >
            {open ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </span>
        Каталог
      </button>

      <div
        className={`fixed inset-0 z-50 ${open ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-black/50 ${overlayTransition} ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={close}
        />
        <div
          id={panelId}
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={`absolute left-0 top-0 flex h-full w-[min(100%,20rem)] flex-col border-r shadow-xl ${
            dark ? "border-white/10 bg-slate-900" : "border-brand-border bg-brand-elevated"
          } ${panelTransition} ${open ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div
            className={`flex items-center justify-between border-b px-4 py-3 ${
              dark ? "border-white/10" : "border-brand-border"
            }`}
          >
            <h2 id={titleId} className={`text-base font-semibold ${dark ? "text-white" : "text-brand-heading"}`}>
              Каталог
            </h2>
            <button
              type="button"
              ref={closeBtnRef}
              className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border transition-colors duration-200 focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand-teal/60 focus-visible:ring-offset-2 ${
                dark
                  ? "border-white/15 text-slate-300 hover:bg-white/10 focus-visible:ring-offset-slate-900"
                  : "border-brand-border text-brand-muted hover:bg-brand-elevated focus-visible:ring-offset-white"
              }`}
              aria-label="Закрыть меню каталога"
              onClick={close}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav
            className="min-h-0 flex-1 overflow-y-auto px-2 py-3"
            aria-label="Категории"
          >
            <ul className="space-y-0.5">
              <li>
                <Link
                  href="/catalog"
                  onClick={close}
                  className={`block rounded-lg px-3 py-2.5 text-sm transition-colors duration-200 ${
                    catalogActive ? itemActive : itemInactive
                  }`}
                  aria-current={catalogActive ? "page" : undefined}
                >
                  Все товары
                </Link>
              </li>
              {categories.map((c) => {
                const active = categorySlug === c.slug;
                return (
                  <li key={c.id}>
                    <Link
                      href={`/category/${c.slug}`}
                      onClick={close}
                      className={`block rounded-lg px-3 py-2.5 text-sm transition-colors duration-200 ${
                        active ? itemActive : itemInactive
                      }`}
                      aria-current={active ? "page" : undefined}
                    >
                      {c.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
