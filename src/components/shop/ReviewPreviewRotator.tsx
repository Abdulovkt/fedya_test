"use client";

import { useCallback, useEffect, useState } from "react";
import { PublicReviewCard } from "@/components/shop/PublicReviewCard";

const AUTO_INTERVAL_MS = 10_000;

export type DeliveryReviewSlide = {
  kind: "delivery";
  id: number;
  rating: number;
  text: string;
  photoUrlsJson: string;
  createdAt: string;
  customerName: string;
};

export type ProductReviewSlide = {
  kind: "product";
  id: number;
  rating: number;
  text: string;
  photoUrlsJson: string;
  createdAt: string;
  customerName: string;
  productName: string;
  productSlug: string;
};

type Slide = DeliveryReviewSlide | ProductReviewSlide;

type Props = {
  items: Slide[];
  ariaLabel: string;
};

export function ReviewPreviewRotator({ items, ariaLabel }: Props) {
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(1);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqMd = window.matchMedia("(min-width: 768px)");
    const onReduce = () => setReduceMotion(mqReduce.matches);
    const onBp = () => setPerPage(mqMd.matches ? 2 : 1);
    onReduce();
    onBp();
    mqReduce.addEventListener("change", onReduce);
    mqMd.addEventListener("change", onBp);
    return () => {
      mqReduce.removeEventListener("change", onReduce);
      mqMd.removeEventListener("change", onBp);
    };
  }, []);

  const pageCount = Math.max(1, Math.ceil(items.length / perPage));

  useEffect(() => {
    setPage((p) => Math.min(p, pageCount - 1));
  }, [pageCount]);

  const safePage = Math.min(page, pageCount - 1);

  useEffect(() => {
    if (reduceMotion || paused || pageCount <= 1) return;
    const t = window.setInterval(() => {
      setPage((p) => (p + 1) % pageCount);
    }, AUTO_INTERVAL_MS);
    return () => window.clearInterval(t);
  }, [reduceMotion, paused, pageCount]);

  const go = useCallback(
    (dir: -1 | 1) => {
      setPage((p) => (p + dir + pageCount) % pageCount);
    },
    [pageCount],
  );

  const start = safePage * perPage;
  const visible = items.slice(start, start + perPage);

  return (
    <div
      className="space-y-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        role="region"
        aria-label={ariaLabel}
        aria-live="polite"
        tabIndex={0}
        className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/40 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-elevated"
        onFocus={() => setPaused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setPaused(false);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            go(-1);
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            go(1);
          }
        }}
      >
        <div className="grid gap-6 md:grid-cols-2">
          {visible.map((r) =>
            r.kind === "delivery" ? (
              <PublicReviewCard
                key={r.id}
                kind="delivery"
                rating={r.rating}
                text={r.text}
                photoUrlsJson={r.photoUrlsJson}
                createdAt={new Date(r.createdAt)}
                customerName={r.customerName}
              />
            ) : (
              <PublicReviewCard
                key={r.id}
                kind="product"
                rating={r.rating}
                text={r.text}
                photoUrlsJson={r.photoUrlsJson}
                createdAt={new Date(r.createdAt)}
                customerName={r.customerName}
                productName={r.productName}
                productSlug={r.productSlug}
              />
            ),
          )}
        </div>
      </div>

      {pageCount > 1 ? (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => go(-1)}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-brand-border bg-brand-surface text-brand-heading shadow-sm transition-colors duration-200 hover:border-brand-teal/50 hover:bg-brand-elevated focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand-teal/50 focus-visible:ring-offset-2"
            aria-label="Предыдущие отзывы"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <div className="flex flex-wrap justify-center gap-1.5" role="tablist" aria-label="Номер набора отзывов">
            {Array.from({ length: pageCount }, (_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === safePage}
                aria-current={i === safePage ? "true" : undefined}
                onClick={() => setPage(i)}
                className={`h-2.5 w-2.5 cursor-pointer rounded-full transition-colors duration-200 focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand-teal/50 focus-visible:ring-offset-2 ${
                  i === safePage ? "bg-brand-teal" : "bg-brand-border hover:bg-brand-muted"
                }`}
                aria-label={`Отзывы, страница ${i + 1} из ${pageCount}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(1)}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-brand-border bg-brand-surface text-brand-heading shadow-sm transition-colors duration-200 hover:border-brand-teal/50 hover:bg-brand-elevated focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand-teal/50 focus-visible:ring-offset-2"
            aria-label="Следующие отзывы"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      ) : null}
    </div>
  );
}
