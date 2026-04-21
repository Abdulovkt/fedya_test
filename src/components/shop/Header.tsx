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
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-3">
            <div className="flex items-center justify-between gap-3 md:contents">
              <Link
                href="/"
                className="relative flex h-10 w-[138px] shrink-0 items-center md:order-1"
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

              <div className="flex shrink-0 items-center gap-3 md:order-3">
                <TelegramIcon url={telegram_url} />
                <CartIcon count={cartCount} />
              </div>
            </div>

            <div className="min-w-0 w-full md:order-2 md:min-w-0 md:flex-1">
              <Suspense>
                <SearchBar categories={cats} />
              </Suspense>
            </div>
          </div>

          <nav
            className="mt-2 -mx-4 flex snap-x snap-mandatory gap-1 overflow-x-auto px-4 pb-1 text-sm md:mx-0 md:px-0"
            aria-label="Категории"
          >
            <Link
              href="/catalog"
              className="shrink-0 snap-start whitespace-nowrap rounded-md px-2 py-1.5 text-brand-muted hover:bg-brand-elevated hover:text-brand-heading"
            >
              Каталог
            </Link>
            {cats.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="shrink-0 snap-start whitespace-nowrap rounded-md px-2 py-1.5 text-brand-muted hover:bg-brand-elevated hover:text-brand-heading"
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
