"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminSignOut } from "@/components/admin/AdminSignOut";

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

export function AdminSidebarNav() {
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
        <nav className="flex flex-col gap-1 text-sm">
          {LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-2 py-1.5 text-brand-heading hover:bg-brand-elevated"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
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
