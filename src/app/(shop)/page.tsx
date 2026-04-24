import Image from "next/image";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ProductCard } from "@/components/shop/ProductCard";
import { StoryBlocks } from "@/components/shop/StoryBlocks";
import { PublicReviewCard } from "@/components/shop/PublicReviewCard";
import { WhyUsPanel } from "@/components/shop/WhyUsPanel";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import {
  getApprovedDeliveryReviews,
  getApprovedProductReviewsSiteWide,
} from "@/lib/reviews-public";
import { ReviewPreviewRotator } from "@/components/shop/ReviewPreviewRotator";
import { normalizeQualityTier } from "@/lib/product-quality";
import { normalizeFulfillmentType } from "@/lib/shipping";

const REFERENCE_HERO_IMAGE = "/hero.jpg";

export default async function HomePage() {
  const [newProducts, deliveryPreview, productPreview] = await Promise.all([
    db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      imageUrl: products.imageUrl,
      stock: products.stock,
      categoryName: categories.name,
      fulfillmentType: products.fulfillmentType,
      qualityTier: products.qualityTier,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.isActive, true))
    .orderBy(desc(products.createdAt))
    .limit(8),
    getApprovedDeliveryReviews(24),
    getApprovedProductReviewsSiteWide(24),
  ]);

  const mergedReviews = [
    ...deliveryPreview.map((r) => ({ kind: "delivery" as const, ...r })),
    ...productPreview.map((r) => ({ kind: "product" as const, ...r })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 24);

  const hasReviewPreview = mergedReviews.length > 0;

  const allSlides = mergedReviews.map((r) =>
    r.kind === "delivery"
      ? {
          kind: "delivery" as const,
          id: r.id,
          rating: r.rating,
          text: r.text,
          photoUrlsJson: r.photoUrls,
          createdAt: r.createdAt.toISOString(),
          customerName: r.customerName,
        }
      : {
          kind: "product" as const,
          id: r.id,
          rating: r.rating,
          text: r.text,
          photoUrlsJson: r.photoUrls,
          createdAt: r.createdAt.toISOString(),
          customerName: r.customerName,
          productName: r.productName,
          productSlug: r.productSlug,
        },
  );

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
              qualityTier={normalizeQualityTier(p.qualityTier)}
            />
          ))}
        </div>
      </section>

      <section className="order-5 border-t border-brand-border bg-brand-elevated px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-brand-heading">Отзывы</h2>
              <p className="mt-1 max-w-2xl text-sm text-brand-muted">
                О доставке и товарах. Тип отзыва указан на карточке; о доставке — бирюзовый
                акцент, о товаре — нейтральный.
              </p>
            </div>
            <Link
              href="/reviews"
              className="text-sm font-medium text-brand hover:text-brand-teal hover:underline"
            >
              Все отзывы
            </Link>
          </div>
          {!hasReviewPreview ? (
            <p className="mt-6 text-sm text-brand-muted">
              Пока нет опубликованных отзывов. Они появятся здесь после покупки и модерации.
            </p>
          ) : (
            <div className="mt-8 rounded-2xl border border-brand-border bg-brand-surface/70 p-5 ring-1 ring-slate-900/5 sm:p-6">
              {mergedReviews.length > 5 ? (
                <ReviewPreviewRotator
                  items={allSlides}
                  ariaLabel="Отзывы покупателей на главной"
                />
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {mergedReviews.map((r) =>
                    r.kind === "delivery" ? (
                      <PublicReviewCard
                        key={`d-${r.id}`}
                        kind="delivery"
                        rating={r.rating}
                        text={r.text}
                        photoUrlsJson={r.photoUrls}
                        createdAt={r.createdAt}
                        customerName={r.customerName}
                      />
                    ) : (
                      <PublicReviewCard
                        key={`p-${r.id}`}
                        kind="product"
                        rating={r.rating}
                        text={r.text}
                        photoUrlsJson={r.photoUrls}
                        createdAt={r.createdAt}
                        customerName={r.customerName}
                        productName={r.productName}
                        productSlug={r.productSlug}
                      />
                    ),
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
      </div>
    </div>
  );
}
