import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { asc } from "drizzle-orm";
import { getCartItemCount } from "@/lib/cart";
import { SearchBar } from "@/components/shop/SearchBar";
import { getSettings } from "@/lib/settings";
import { HeaderCatalogNavSlot } from "@/components/shop/HeaderCatalogNavSlot";
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
      <header className="sticky top-0 z-40 border-b border-slate-800/90 bg-slate-900/98 shadow-md shadow-black/25 backdrop-blur-md">
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
                  className="object-contain brightness-0 invert"
                  sizes="138px"
                />
              </Link>

              <div className="flex shrink-0 items-center gap-3 md:order-3">
                <TelegramIcon url={telegram_url} dark />
                <CartIcon count={cartCount} dark />
              </div>
            </div>

            <div className="min-w-0 w-full md:order-2 md:min-w-0 md:flex-1">
              <Suspense>
                <SearchBar categories={cats} inHeaderDark />
              </Suspense>
            </div>
          </div>

          <div className="mt-2 -mx-4 md:mx-0">
            <div className="px-4 md:px-0">
              <HeaderCatalogNavSlot categories={cats} dark />
            </div>
          </div>
        </div>
      </header>
      <div className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6 sm:py-3 lg:px-8">
          <DiscountInfo compact variant="headerBar" />
        </div>
      </div>
    </>
  );
}
