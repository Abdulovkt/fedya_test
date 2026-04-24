import {
  getApprovedDeliveryReviews,
  getApprovedProductReviewsSiteWide,
  getDeliveryAverageRating,
  getProductReviewsSiteAverage,
} from "@/lib/reviews-public";
import { PublicReviewCard } from "@/components/shop/PublicReviewCard";

export const metadata = { title: "Отзывы" };

function stars(rounded: number) {
  return (
    <span className="inline-flex gap-0.5 text-amber-500" aria-label={`${rounded} из 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i}>{i < rounded ? "★" : "☆"}</span>
      ))}
    </span>
  );
}

function StatsLine({
  label,
  stats,
}: {
  label: string;
  stats: { count: number; average: number | null };
}) {
  if (stats.average == null || stats.count === 0) {
    return <p className="mt-1 text-sm text-brand-muted">Пока нет оценок.</p>;
  }
  return (
    <p className="mt-1 text-sm text-brand-muted">
      {label}:{" "}
      <strong className="text-brand-heading">{stats.average.toFixed(1)}</strong> / 5{" "}
      <span className="ml-2 inline-flex align-middle">{stars(Math.round(stats.average))}</span>
      <span className="ml-1">({stats.count})</span>
    </p>
  );
}

export default async function AllReviewsPage() {
  const [deliveryStats, productStats, deliveryList, productList] = await Promise.all([
    getDeliveryAverageRating(),
    getProductReviewsSiteAverage(),
    getApprovedDeliveryReviews(50),
    getApprovedProductReviewsSiteWide(50),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-brand-heading">Отзывы</h1>
      <p className="mt-2 max-w-2xl text-sm text-brand-muted sm:text-base">
        Мнения покупателей о доставке и товарах. Отзывы публикуются после модерации.
      </p>

      <section id="delivery" className="mt-12 scroll-mt-24">
        <div className="rounded-2xl border border-brand-teal/25 bg-brand-teal/[0.06] p-5 sm:p-8">
          <h2 className="text-xl font-semibold text-brand-teal sm:text-2xl">О доставке</h2>
          <p className="mt-1 text-sm text-brand-muted">О сервисе доставки</p>
          <StatsLine label="Средняя оценка доставки" stats={deliveryStats} />
          {deliveryList.length === 0 ? (
            <p className="mt-6 text-sm text-brand-muted">Пока нет опубликованных отзывов о доставке.</p>
          ) : (
            <ul className="mt-6 space-y-5">
              {deliveryList.map((r) => (
                <li key={r.id}>
                  <PublicReviewCard
                    kind="delivery"
                    rating={r.rating}
                    text={r.text}
                    photoUrlsJson={r.photoUrls}
                    createdAt={r.createdAt}
                    customerName={r.customerName}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section id="products" className="mt-14 scroll-mt-24 border-t border-brand-border pt-12">
        <div className="rounded-2xl border border-brand-border bg-brand-surface/85 p-5 ring-1 ring-brand/5 sm:p-8">
          <h2 className="text-xl font-semibold text-brand-heading sm:text-2xl">О товарах</h2>
          <p className="mt-1 text-sm text-brand-muted">О купленных товарах</p>
          <StatsLine label="Средняя оценка товаров" stats={productStats} />
          {productList.length === 0 ? (
            <p className="mt-6 text-sm text-brand-muted">Пока нет опубликованных отзывов о товарах.</p>
          ) : (
            <ul className="mt-6 space-y-5">
              {productList.map((r) => (
                <li key={r.id}>
                  <PublicReviewCard
                    kind="product"
                    rating={r.rating}
                    text={r.text}
                    photoUrlsJson={r.photoUrls}
                    createdAt={r.createdAt}
                    customerName={r.customerName}
                    productName={r.productName}
                    productSlug={r.productSlug}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
