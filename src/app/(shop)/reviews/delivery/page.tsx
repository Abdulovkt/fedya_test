import Image from "next/image";
import {
  getApprovedDeliveryReviews,
  getDeliveryAverageRating,
} from "@/lib/reviews-public";
import { parseReviewPhotoUrls } from "@/lib/review-display";

export const metadata = { title: "Отзывы о доставке" };

function stars(rounded: number) {
  return (
    <span className="inline-flex gap-0.5 text-amber-500" aria-label={`${rounded} из 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i}>{i < rounded ? "★" : "☆"}</span>
      ))}
    </span>
  );
}

function displayCustomerName(full: string) {
  const t = full.trim().split(/\s+/)[0];
  return t || "Покупатель";
}

export default async function DeliveryReviewsPage() {
  const [stats, list] = await Promise.all([
    getDeliveryAverageRating(),
    getApprovedDeliveryReviews(40),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-brand-heading">Отзывы о доставке</h1>
      {stats.average != null && (
        <p className="mt-2 text-sm text-brand-muted">
          Средняя оценка: <strong className="text-brand-heading">{stats.average.toFixed(1)}</strong> / 5{" "}
          <span className="ml-2 inline-flex align-middle">
            {stars(Math.round(stats.average))}
          </span>
          <span className="ml-1">({stats.count})</span>
        </p>
      )}
      {list.length === 0 ? (
        <p className="mt-8 text-brand-muted">Пока нет опубликованных отзывов о доставке.</p>
      ) : (
        <ul className="mt-8 space-y-6">
          {list.map((r) => {
            const photos = parseReviewPhotoUrls(r.photoUrls);
            return (
              <li
                key={r.id}
                className="rounded-xl border border-brand-border bg-brand-elevated/50 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-brand-heading">{displayCustomerName(r.customerName)}</p>
                  <div className="text-sm text-amber-600">{stars(r.rating)}</div>
                  <time className="text-xs text-brand-muted" dateTime={r.createdAt.toISOString()}>
                    {r.createdAt.toLocaleDateString("ru-RU")}
                  </time>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-brand-muted">{r.text}</p>
                {photos.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {photos.map((src) => (
                      <a
                        key={src}
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative h-24 w-24 overflow-hidden rounded-lg border border-brand-border"
                      >
                        <Image src={src} alt="" fill className="object-cover" sizes="96px" />
                      </a>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
