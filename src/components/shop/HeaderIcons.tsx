"use client";

import Link from "next/link";
import { useState } from "react";

export function TelegramIcon({ url }: { url: string }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={url || "#"}
      target={url ? "_blank" : undefined}
      rel={url ? "noopener noreferrer" : undefined}
      aria-label="Telegram канал"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex h-9 w-9 items-center justify-center rounded-lg border bg-brand-elevated shadow-sm transition-all duration-200"
      style={{
        borderColor: hovered ? "rgba(42,171,238,0.5)" : "var(--color-brand-border)",
        color: hovered ? "#2AABEE" : "var(--color-brand-muted)",
      }}
    >
      {!hovered ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M22 2 11 13" />
          <path d="M22 2 15 22 11 13 2 9 22 2Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 scale-110">
          <path d="M22 2 15 22 11 13 2 9 22 2Z" />
        </svg>
      )}
    </Link>
  );
}

export function CartIcon({ count }: { count: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href="/cart"
      aria-label="Корзина"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex h-9 w-9 items-center justify-center rounded-lg border bg-brand-elevated shadow-sm transition-all duration-200"
      style={{
        borderColor: hovered ? "rgba(224,44,92,0.4)" : "var(--color-brand-border)",
        color: hovered ? "var(--color-brand)" : "var(--color-brand-muted)",
      }}
    >
      {!hovered ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5 scale-110">
          <circle cx="9" cy="21" r="1.5" fill="currentColor" />
          <circle cx="20" cy="21" r="1.5" fill="currentColor" />
          <path fill="currentColor" d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6L4 1H1z" />
        </svg>
      )}

      {count > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-xs font-semibold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
