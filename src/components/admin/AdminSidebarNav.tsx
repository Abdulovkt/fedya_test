"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminSignOut } from "@/components/admin/AdminSignOut";
import {
  ADMIN_LOW_STOCK_MAX,
  EMPTY_ADMIN_NAV_BADGES,
  type AdminNavBadgeCounts,
} from "@/lib/admin-nav-badges-types";

const LINKS: { href: string; label: string }[] = [
  { href: "/admin", label: "Обзор" },
  { href: "/admin/categories", label: "Категории" },
  { href: "/admin/products", label: "Товары" },
  { href: "/admin/orders", label: "Заказы" },
  { href: "/admin/reports", label: "Отчёты" },
  { href: "/admin/promocodes", label: "Промокоды" },
  { href: "/admin/chats", label: "Чаты" },
  { href: "/admin/reviews", label: "Отзывы" },
  { href: "/admin/settings", label: "Настройки" },
];

function formatBadgeN(n: number) {
  return n > 99 ? "99+" : String(n);
}

type Props = { badges?: AdminNavBadgeCounts };

export function AdminSidebarNav({ badges = EMPTY_ADMIN_NAV_BADGES }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <aside className="print:hidden w-full shrink-0 space-y-2 rounded-xl border border-brand-border bg-brand-surface/50 p-4 sm:w-56">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
          Админка
        </p>
        <button
          type="button"
          className="rounded-md border border-brand-border bg-brand-elevated px-3 py-1.5 text-sm font-medium text-brand-heading md:hidden"
          aria-expanded={open}
          aria-controls="admin-dashboard-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Закрыть" : "Меню"}
        </button>
      </div>
      <div
        id="admin-dashboard-nav"
        className={open ? "space-y-2 pt-1" : "hidden space-y-2 pt-1 md:block"}
      >
        <nav className="flex flex-col gap-1 text-sm" aria-label="Разделы админки">
          {LINKS.map((item) => {
            const isChats = item.href === "/admin/chats";
            const isProducts = item.href === "/admin/products";
            const isReviews = item.href === "/admin/reviews";

            let badgeN = 0;
            let badgeClass = "bg-brand-teal";
            let badgeTitle = "";
            let a11yExtra = "";

            if (isChats) {
              badgeN = badges.chatUnread;
              badgeTitle =
                badgeN > 0
                  ? `Непрочитанных сообщений: ${badgeN}`
                  : "";
              a11yExtra =
                badgeN > 0
                  ? `, ${badgeN} непрочитанных сообщений`
                  : "";
            } else if (isProducts) {
              const oos = badges.productOutOfStock;
              const low = badges.productLowStock;
              badgeN = oos + low;
              const parts: string[] = [];
              if (oos) parts.push(`нет в наличии: ${oos}`);
              if (low) {
                parts.push(
                  `мало на складе (1–${ADMIN_LOW_STOCK_MAX}): ${low}`,
                );
              }
              badgeTitle = parts.length ? parts.join(" · ") : "";
              if (badgeN > 0) {
                a11yExtra = `, внимание к остаткам: ${badgeN} (${[
                  oos ? `${oos} нет в наличии` : null,
                  low ? `${low} с малым остатком` : null,
                ]
                  .filter(Boolean)
                  .join(", ")})`;
              }
              if (oos > 0) {
                badgeClass =
                  "bg-red-600";
              } else if (low > 0) {
                badgeClass = "bg-amber-500 text-slate-900";
              }
            } else if (isReviews) {
              badgeN = badges.reviewsPending;
              badgeClass = "bg-amber-600";
              badgeTitle =
                badgeN > 0
                  ? `На модерации: ${badgeN}`
                  : "";
              a11yExtra =
                badgeN > 0 ? `, ${badgeN} на модерации` : "";
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-[2rem] w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-brand-heading transition-colors hover:bg-brand-elevated"
                onClick={() => setOpen(false)}
                title={badgeTitle || undefined}
                aria-label={
                  a11yExtra
                    ? `${item.label}${a11yExtra}`
                    : item.label
                }
              >
                <span>{item.label}</span>
                {badgeN > 0 && (
                  <span
                    className={`inline-flex min-w-[1.25rem] shrink-0 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white ${badgeClass}`}
                    aria-hidden
                  >
                    {formatBadgeN(badgeN)}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-brand-border pt-3">
          <Link
            href="/"
            className="text-xs text-brand-muted hover:text-brand-teal"
          >
            На сайт
          </Link>
          <div className="mt-2">
            <AdminSignOut />
          </div>
        </div>
      </div>
    </aside>
  );
}
