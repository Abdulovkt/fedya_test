"use client";

import Image from "next/image";
import Link from "next/link";
import { displayReviewCustomerName, parseReviewPhotoUrls } from "@/lib/review-display";
import { isPublicUploadPath } from "@/lib/public-assets";

function starsRow(n: number) {
  return (
    <span className="inline-flex gap-0.5 text-amber-500" aria-label={`${n} из 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i}>{i < n ? "★" : "☆"}</span>
      ))}
    </span>
  );
}

function IconTruck({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M14 18V6h2.2L20 9.3V18" />
      <path d="M4 18V8h10v10" />
      <path d="M2 18h20" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </svg>
  );
}

function IconPackage({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 16V8l-9-5-9 5v8l9 5 9-5z" />
      <path d="m3.3 7.7 9 5.1 8.9-5.1" />
      <path d="M12 22V12.8" />
    </svg>
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
    ? "border-l-4 border-brand-teal bg-brand-surface/90 ring-1 ring-brand-teal/15"
    : "border-l-4 border-brand/35 bg-brand-elevated/60 ring-1 ring-brand/10";

  return (
    <blockquote
      className={`rounded-xl border border-brand-border p-5 text-sm text-brand-muted shadow-sm transition-colors duration-200 ${shell}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            isDelivery
              ? "bg-brand-teal/12 text-brand-teal"
              : "bg-brand/10 text-brand-heading"
          }`}
        >
          {isDelivery ? (
            <IconTruck className="h-3.5 w-3.5 shrink-0 opacity-90" />
          ) : (
            <IconPackage className="h-3.5 w-3.5 shrink-0 opacity-90" />
          )}
          {isDelivery ? "Доставка" : "Товар"}
        </span>
        {!isDelivery && productName && productSlug && (
          <Link
            href={`/product/${productSlug}`}
            className="cursor-pointer text-sm font-medium text-brand hover:text-brand-teal hover:underline"
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
              className="relative h-20 w-20 cursor-pointer overflow-hidden rounded-lg border border-brand-border"
            >
              <Image
                src={src}
                alt="Фото из отзыва"
                fill
                unoptimized={isPublicUploadPath(src)}
                className="object-cover"
                sizes="80px"
              />
            </a>
          ))}
        </div>
      )}
    </blockquote>
  );
}
