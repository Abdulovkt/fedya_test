import Image from "next/image";
import Link from "next/link";
import { displayReviewCustomerName, parseReviewPhotoUrls } from "@/lib/review-display";

function starsRow(n: number) {
  return (
    <span className="inline-flex gap-0.5 text-amber-500" aria-label={`${n} из 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i}>{i < n ? "★" : "☆"}</span>
      ))}
    </span>
  );
}

type Props = {
  kind: "delivery" | "product";
  rating: number;
  text: string;
  photoUrlsJson: string;
  createdAt: Date;
  customerName: string;
  productName?: string;
  productSlug?: string;
};

export function PublicReviewCard({
  kind,
  rating,
  text,
  photoUrlsJson,
  createdAt,
  customerName,
  productName,
  productSlug,
}: Props) {
  const photos = parseReviewPhotoUrls(photoUrlsJson);
  const isDelivery = kind === "delivery";
  const shell = isDelivery
    ? "border-l-4 border-brand-teal bg-brand-surface/90"
    : "border-l-4 border-brand/35 bg-brand-elevated/60";

  return (
    <blockquote
      className={`rounded-xl border border-brand-border p-5 text-sm text-brand-muted shadow-sm transition-colors duration-200 ${shell}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            isDelivery
              ? "bg-brand-teal/12 text-brand-teal"
              : "bg-brand/10 text-brand-heading"
          }`}
        >
          {isDelivery ? "Доставка" : "Товар"}
        </span>
        {!isDelivery && productName && productSlug && (
          <Link
            href={`/product/${productSlug}`}
            className="text-sm font-medium text-brand hover:text-brand-teal hover:underline"
          >
            {productName}
          </Link>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-brand-heading">
          {displayReviewCustomerName(customerName)}
        </p>
        <div className="text-sm text-amber-600">{starsRow(rating)}</div>
        <time className="text-xs text-brand-muted" dateTime={createdAt.toISOString()}>
          {createdAt.toLocaleDateString("ru-RU")}
        </time>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-brand-heading/95">
        &ldquo;{text}&rdquo;
      </p>
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
              <Image src={src} alt="" fill className="object-cover" sizes="80px" />
            </a>
          ))}
        </div>
      )}
    </blockquote>
  );
}
