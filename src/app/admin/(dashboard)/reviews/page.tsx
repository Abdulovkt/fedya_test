import Image from "next/image";
import Link from "next/link";
import { listCustomerReviewsForAdmin } from "@/app/actions/admin-reviews";
import { ReviewsModeration } from "@/components/admin/ReviewsModeration";
import { db } from "@/db";
import { products } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { parseReviewPhotoUrls } from "@/lib/review-display";

export const metadata = { title: "Отзывы" };

type Props = { searchParams: Promise<{ filter?: string }> };

export default async function AdminReviewsPage({ searchParams }: Props) {
  const { filter } = await searchParams;
  const mode = filter === "all" ? "all" : "pending";
  const rows = await listCustomerReviewsForAdmin(mode);

  const productIds = [
    ...new Set(rows.map((r) => r.productId).filter((id): id is number => id != null)),
  ];
  const productNames =
    productIds.length > 0
      ? await db
          .select({ id: products.id, name: products.name, slug: products.slug })
          .from(products)
          .where(inArray(products.id, productIds))
      : [];
  const productById = new Map(productNames.map((p) => [p.id, p]));

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-heading">Модерация отзывов</h1>
      <p className="mt-1 text-sm text-brand-muted">Одобрённые отзывы публикуются в каталоге.</p>
      <div className="mt-4 flex gap-2 text-sm">
        <FilterLink href="/admin/reviews" active={mode === "pending"}>
          На модерации
        </FilterLink>
        <FilterLink href="/admin/reviews?filter=all" active={mode === "all"}>
          Все
        </FilterLink>
      </div>
      {rows.length === 0 ? (
        <p className="mt-8 text-brand-muted">Нет записей.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {rows.map((r) => {
            const prod = r.productId != null ? productById.get(r.productId) : null;
            const reviewPhotos = parseReviewPhotoUrls(r.photoUrls);
            return (
              <li
                key={r.id}
                className="rounded-xl border border-brand-border bg-brand-surface/50 p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium text-brand-heading">
                    {r.kind === "delivery" ? "Доставка" : `Товар: ${prod?.name ?? `#${r.productId}`}`}
                  </span>
                  <span className="text-brand-muted">
                    Заказ{" "}
                    <Link
                      href={`/admin/orders/${r.orderId}`}
                      className="text-brand-teal hover:underline"
                    >
                      {r.publicOrderNumber ?? `#${r.orderId}`}
                    </Link>
                    {" · "}
                    {r.customerName}
                  </span>
                </div>
                <p className="mt-1 text-amber-700">★ {r.rating} / 5</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-brand-muted">{r.text}</p>
                {reviewPhotos.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {reviewPhotos.map((src) => (
                      <a
                        key={src}
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative h-16 w-16 overflow-hidden rounded border border-brand-border"
                      >
                        <Image src={src} alt="" fill className="object-cover" sizes="64px" />
                      </a>
                    ))}
                  </div>
                )}
                {prod && (
                  <p className="mt-1 text-xs">
                    <Link className="text-brand-teal hover:underline" href={`/product/${prod.slug}`}>
                      страница товара
                    </Link>
                  </p>
                )}
                <ReviewsModeration reviewId={r.id} currentStatus={r.moderationStatus} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 font-medium ${
        active ? "bg-brand text-white" : "border border-brand-border bg-brand-elevated text-brand-heading"
      }`}
    >
      {children}
    </Link>
  );
}
