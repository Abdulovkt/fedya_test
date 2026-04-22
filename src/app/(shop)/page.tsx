import Image from "next/image";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ProductCard } from "@/components/shop/ProductCard";
import { StoryBlocks } from "@/components/shop/StoryBlocks";
import { WhyUsPanel } from "@/components/shop/WhyUsPanel";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { normalizeFulfillmentType } from "@/lib/shipping";

const REFERENCE_HERO_IMAGE = "/hero.jpg";

export default async function HomePage() {
  const newProducts = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      imageUrl: products.imageUrl,
      stock: products.stock,
      categoryName: categories.name,
      fulfillmentType: products.fulfillmentType,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.isActive, true))
    .orderBy(desc(products.createdAt))
    .limit(8);

  return (
    <div>
      <section className="border-b border-brand-border bg-brand-bg px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl border border-brand-teal/40">
          <Image
            src={REFERENCE_HERO_IMAGE}
            alt="Спортивное питание и тренировки"
            fill
            priority
            className="object-cover object-center"
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/35" />
          <div className="relative flex flex-col items-start justify-center px-6 py-16 sm:px-12 sm:py-32 lg:px-16 lg:py-40">
            <h1 className="max-w-xl text-3xl font-extrabold leading-tight tracking-tight text-white drop-shadow sm:text-4xl md:text-5xl">
              Интернет-магазин
              <br />
              Спортивного питания
            </h1>
            <p className="mt-4 max-w-sm text-sm text-white/80 sm:text-base">
              Купите спортпит с доставкой из России.
              <br />
              Большой выбор, лучшие цены.
            </p>
            <Link
              href="/catalog"
              className="mt-8 inline-flex w-full justify-center rounded-md bg-brand-teal px-8 py-3 text-sm font-bold uppercase tracking-widest text-white shadow-lg transition hover:bg-brand-teal/80 sm:w-auto"
            >
              Смотреть каталог
            </Link>
          </div>
        </div>
      </section>

      <div className="flex flex-col">
        <section className="order-3 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:order-2 lg:px-8">
          <WhyUsPanel />
        </section>

        <div className="order-4 lg:order-3">
          <StoryBlocks />
        </div>

        <section className="order-2 mx-auto max-w-7xl px-4 pt-2 pb-14 sm:px-6 lg:order-4 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold text-brand-heading">Новинки</h2>
          <Link
            href="/catalog"
            className="text-sm text-brand hover:text-brand-teal hover:underline"
          >
            Весь каталог
          </Link>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {newProducts.map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              name={p.name}
              slug={p.slug}
              price={p.price}
              imageUrl={p.imageUrl}
              stock={p.stock}
              categoryName={p.categoryName}
              fulfillmentType={normalizeFulfillmentType(p.fulfillmentType)}
            />
          ))}
        </div>
      </section>

      <section className="order-5 border-t border-brand-border bg-brand-elevated px-4 py-12 sm:px-6 lg:px-8">
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
    </div>
  );
}
