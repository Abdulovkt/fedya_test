import Image from "next/image";
import {
  getApprovedProductReviewsForProduct,
  getProductAverageRating,
} from "@/lib/reviews-public";
import { parseReviewPhotoUrls } from "@/lib/review-display";

function stars(rating: number) {
  return (
    <span className="inline-flex gap-0.5 text-amber-500" aria-label={`${rating} из 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i}>{i < Math.round(rating) ? "★" : "☆"}</span>
      ))}
    </span>
  );
}

function starsRow(n: number) {
  return (
    <span className="inline-flex gap-0.5 text-amber-500" aria-label={`${n} из 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i}>{i < n ? "★" : "☆"}</span>
      ))}
    </span>
  );
}

function displayCustomerName(full: string) {
  const t = full.trim().split(/\s+/)[0];
  return t || "Покупатель";
}

type Props = { productId: number };

export async function ProductReviewsBlock({ productId }: Props) {
  const [stats, list] = await Promise.all([
    getProductAverageRating(productId),
    getApprovedProductReviewsForProduct(productId),
  ]);

  if (list.length === 0) {
    return (
      <section className="mt-12 border-t border-brand-border pt-10">
        <h2 className="text-xl font-bold text-brand-heading">Отзывы</h2>
        <p className="mt-2 text-sm text-brand-muted">Пока нет отзывов с этим товаром.</p>
      </section>
    );
  }

  return (
    <section className="mt-12 border-t border-brand-border pt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-bold text-brand-heading">Отзывы</h2>
        {stats.average != null && (
          <p className="text-sm text-brand-muted">
            Средняя оценка: <strong className="text-brand-heading">{stats.average.toFixed(1)}</strong>{" "}
            / 5
            <span className="ml-2 inline-flex align-middle">{stars(Math.round(stats.average))}</span>
            <span className="ml-1">({stats.count})</span>
          </p>
        )}
      </div>
      <ul className="mt-6 space-y-6">
        {list.map((r) => {
          const photos = parseReviewPhotoUrls(r.photoUrls);
          return (
            <li
              key={r.id}
              className="rounded-xl border border-brand-border bg-brand-elevated/50 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-brand-heading">
                  {displayCustomerName(r.customerName)}
                </p>
                <div className="text-sm text-amber-600">{starsRow(r.rating)}</div>
                <time
                  className="text-xs text-brand-muted"
                  dateTime={r.createdAt.toISOString()}
                >
                  {r.createdAt.toLocaleDateString("ru-RU")}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-brand-muted">{r.text}</p>
              {photos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {photos.map((src) => (
                    <a
                      key={src}
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative h-20 w-20 overflow-hidden rounded-lg border border-brand-border"
                    >
                      <Image
                        src={src}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </a>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
