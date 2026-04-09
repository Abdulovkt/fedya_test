import Image from "next/image";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ProductCard } from "@/components/shop/ProductCard";
import { db } from "@/db";
import { categories, products } from "@/db/schema";

/** Как на примере: og:image главной. */
const REFERENCE_HERO_IMAGE =
  "https://fedorpharmshop.com/wp-content/uploads/sites/3/2026/02/photo_2026-02-25_01-01-13.jpg";

export default async function HomePage() {
  const newProducts = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      imageUrl: products.imageUrl,
      categoryName: categories.name,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.isActive, true))
    .orderBy(desc(products.createdAt))
    .limit(8);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-brand-border">
        <Image
          src={REFERENCE_HERO_IMAGE}
          alt="Спортивное питание и тренировки"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/20" />
        <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-center px-8 py-28 sm:px-12 sm:py-36 lg:px-16 lg:py-44">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
            Интернет-магазин
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-white drop-shadow sm:text-5xl lg:text-6xl">
            Спортивное питание с доставкой
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/80">
            Протеин, креатин, аминокислоты и добавки для тренировок — удобный
            каталог и быстрое оформление заказа.
          </p>
          <Link
            href="/catalog"
            className="mt-10 inline-flex rounded-md bg-brand px-10 py-4 text-base font-bold uppercase tracking-widest text-white shadow-lg transition hover:bg-brand-hover"
          >
            Смотреть каталог
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-brand-heading">Почему мы</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            "Широкий выбор продукции",
            "Быстрое оформление заказа",
            "Аккуратная доставка",
            "Поддержка и консультации",
          ].map((t) => (
            <li
              key={t}
              className="rounded-xl border border-brand-border bg-brand-surface px-4 py-5 text-sm text-brand-muted shadow-sm"
            >
              {t}
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold text-brand-heading">Новинки</h2>
          <Link
            href="/catalog"
            className="text-sm text-brand hover:text-brand-teal hover:underline"
          >
            Весь каталог
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {newProducts.map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              name={p.name}
              slug={p.slug}
              price={p.price}
              imageUrl={p.imageUrl}
              categoryName={p.categoryName}
            />
          ))}
        </div>
      </section>

      <section className="border-t border-brand-border bg-brand-elevated px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-2xl font-bold text-brand-heading">Отзывы</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Алексей",
                text: "Заказ пришёл быстро, упаковка целая. Протеин как в описании.",
              },
              {
                name: "Мария",
                text: "Удобный сайт, понятные категории. Буду заказывать ещё.",
              },
              {
                name: "Дмитрий",
                text: "Хороший выбор креатина и BCAA. Рекомендую магазин.",
              },
            ].map((r) => (
              <blockquote
                key={r.name}
                className="rounded-xl border border-brand-border bg-brand-surface p-5 text-sm text-brand-muted shadow-sm"
              >
                <p className="text-brand-heading">&ldquo;{r.text}&rdquo;</p>
                <footer className="mt-3 text-xs text-brand-muted/90">
                  — {r.name}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
