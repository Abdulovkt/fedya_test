import Link from "next/link";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { asc } from "drizzle-orm";
import { getCartItemCount } from "@/lib/cart";

export async function Header() {
  const cats = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
  const cartCount = await getCartItemCount();

  return (
    <header className="sticky top-0 z-40 border-b border-brand-border bg-brand-surface/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-brand"
          >
            SportNutrition
          </Link>
          <Link
            href="/cart"
            className="relative rounded-lg border border-brand-border bg-brand-elevated px-3 py-1.5 text-sm font-medium text-brand-heading shadow-sm hover:border-brand/40"
          >
            Корзина
            {cartCount > 0 ? (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-xs font-semibold text-white">
                {cartCount}
              </span>
            ) : null}
          </Link>
        </div>
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            href="/catalog"
            className="rounded-md px-2 py-1 text-brand-muted hover:bg-brand-elevated hover:text-brand-heading"
          >
            Каталог
          </Link>
          {cats.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="rounded-md px-2 py-1 text-brand-muted hover:bg-brand-elevated hover:text-brand-heading"
            >
              {c.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
