"use client";

import Link from "next/link";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function TelegramIcon({
  url,
  dark = false,
}: {
  url: string;
  /** Стили под тёмную шапку */
  dark?: boolean;
}) {
  return (
    <Link
      href={url || "#"}
      target={url ? "_blank" : undefined}
      rel={url ? "noopener noreferrer" : undefined}
      aria-label="Telegram канал"
      className={cx(
        "group relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border shadow-sm transition-colors duration-200",
        dark
          ? "border-white/15 bg-white/5 text-slate-400 hover:border-[#2AABEE]/55 hover:text-[#2AABEE] focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#2AABEE]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          : "border-brand-border bg-brand-elevated text-brand-muted hover:border-[#2AABEE]/50 hover:text-[#2AABEE] focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#2AABEE]/40 focus-visible:ring-offset-2",
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 group-hover:hidden"
        aria-hidden="true"
      >
        <path d="M22 2 11 13" />
        <path d="M22 2 15 22 11 13 2 9 22 2Z" />
      </svg>
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="hidden h-5 w-5 group-hover:block"
        aria-hidden="true"
      >
        <path d="M22 2 15 22 11 13 2 9 22 2Z" />
      </svg>
    </Link>
  );
}

export function CartIcon({
  count,
  dark = false,
}: {
  count: number;
  dark?: boolean;
}) {
  return (
    <Link
      href="/cart"
      aria-label="Корзина"
      className={cx(
        "group relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border shadow-sm transition-colors duration-200",
        dark
          ? "border-white/15 bg-white/5 text-slate-400 hover:border-brand/45 hover:text-brand focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          : "border-brand-border bg-brand-elevated text-brand-muted hover:border-brand/40 hover:text-brand focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-offset-2",
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 group-hover:hidden"
        aria-hidden="true"
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      <svg viewBox="0 0 24 24" className="hidden h-5 w-5 group-hover:block" aria-hidden="true">
        <circle cx="9" cy="21" r="1.5" fill="currentColor" />
        <circle cx="20" cy="21" r="1.5" fill="currentColor" />
        <path
          fill="currentColor"
          d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6L4 1H1z"
        />
      </svg>

      {count > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-xs font-semibold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
