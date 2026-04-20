import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { asc } from "drizzle-orm";
import { getCartItemCount } from "@/lib/cart";
import { SearchBar } from "@/components/shop/SearchBar";
import { getSettings } from "@/lib/settings";
import { DiscountInfo } from "@/components/shop/DiscountInfo";
import { CartIcon, TelegramIcon } from "@/components/shop/HeaderIcons";

export async function Header() {
  const cats = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
  const cartCount = await getCartItemCount();
  const { telegram_url } = await getSettings();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-brand-border bg-brand-surface/95 shadow-sm backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="relative flex h-10 w-[138px] items-center"
              aria-label="FedorPharm"
            >
              <Image
                src="/logo-black.png"
                alt="FedorPharm"
                fill
                priority
                className="object-contain"
                sizes="138px"
              />
            </Link>

            <div className="flex-1">
              <Suspense>
                <SearchBar categories={cats} />
              </Suspense>
            </div>

            <div className="flex items-center gap-3">
              <TelegramIcon url={telegram_url} />
              <CartIcon count={cartCount} />
            </div>
          </div>

          <nav className="mt-2 flex flex-wrap items-center gap-2 text-sm">
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
      <div className="border-b border-brand-border bg-brand-surface/90">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <DiscountInfo compact />
        </div>
      </div>
    </>
  );
}
