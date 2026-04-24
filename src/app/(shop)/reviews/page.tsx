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

  const mergedReviews = [
    ...deliveryList.map((r) => ({ kind: "delivery" as const, ...r })),
    ...productList.map((r) => ({ kind: "product" as const, ...r })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const hasAnyReviews = mergedReviews.length > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-brand-heading">Отзывы</h1>
      <p className="mt-2 max-w-2xl text-sm text-brand-muted sm:text-base">
        Мнения покупателей о доставке и товарах. Отзывы публикуются после модерации. Тип отзыва
        указан на карточке; о доставке — бирюзовый акцент, о товаре — нейтральный.
      </p>

      <div className="mt-10 rounded-2xl border border-brand-border bg-brand-surface/70 p-5 ring-1 ring-slate-900/5 sm:p-8">
        <h2 className="text-lg font-semibold text-brand-heading">Сводка оценок</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-teal">
              Доставка
            </p>
            <StatsLine label="Средняя оценка доставки" stats={deliveryStats} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-heading">
              Товары
            </p>
            <StatsLine label="Средняя оценка товаров" stats={productStats} />
          </div>
        </div>

        {!hasAnyReviews ? (
          <p className="mt-8 text-sm text-brand-muted">
            Пока нет опубликованных отзывов.
          </p>
        ) : (
          <ul className="mt-8 space-y-5">
            {mergedReviews.map((r) =>
              r.kind === "delivery" ? (
                <li key={`d-${r.id}`}>
                  <PublicReviewCard
                    kind="delivery"
                    rating={r.rating}
                    text={r.text}
                    photoUrlsJson={r.photoUrls}
                    createdAt={r.createdAt}
                    customerName={r.customerName}
                  />
                </li>
              ) : (
                <li key={`p-${r.id}`}>
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
              ),
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
