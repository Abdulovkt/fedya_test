import { and, count, desc, eq, sum } from "drizzle-orm";
import { db } from "@/db";
import { customerReviews, orders } from "@/db/schema";

export async function getApprovedProductReviewsForProduct(
  productId: number,
  limit = 50,
) {
  return db
    .select({
      id: customerReviews.id,
      rating: customerReviews.rating,
      text: customerReviews.text,
      photoUrls: customerReviews.photoUrls,
      createdAt: customerReviews.createdAt,
      customerName: orders.customerName,
    })
    .from(customerReviews)
    .innerJoin(orders, eq(customerReviews.orderId, orders.id))
    .where(
      and(
        eq(customerReviews.productId, productId),
        eq(customerReviews.kind, "product"),
        eq(customerReviews.moderationStatus, "approved"),
      ),
    )
    .orderBy(desc(customerReviews.createdAt))
    .limit(limit);
}

export async function getProductAverageRating(
  productId: number,
): Promise<{ count: number; average: number | null }> {
  const [row] = await db
    .select({
      n: count(),
      s: sum(customerReviews.rating),
    })
    .from(customerReviews)
    .where(
      and(
        eq(customerReviews.productId, productId),
        eq(customerReviews.kind, "product"),
        eq(customerReviews.moderationStatus, "approved"),
      ),
    );

  const c = Number(row?.n ?? 0);
  const s = row?.s != null ? Number(row.s) : 0;
  if (c === 0) return { count: 0, average: null };
  return { count: c, average: s / c };
}

export async function getApprovedDeliveryReviews(limit = 30) {
  return db
    .select({
      id: customerReviews.id,
      rating: customerReviews.rating,
      text: customerReviews.text,
      photoUrls: customerReviews.photoUrls,
      createdAt: customerReviews.createdAt,
      customerName: orders.customerName,
    })
    .from(customerReviews)
    .innerJoin(orders, eq(customerReviews.orderId, orders.id))
    .where(
      and(
        eq(customerReviews.kind, "delivery"),
        eq(customerReviews.moderationStatus, "approved"),
      ),
    )
    .orderBy(desc(customerReviews.createdAt))
    .limit(limit);
}

export async function getDeliveryAverageRating(): Promise<{
  count: number;
  average: number | null;
}> {
  const [row] = await db
    .select({
      n: count(),
      s: sum(customerReviews.rating),
    })
    .from(customerReviews)
    .where(
      and(
        eq(customerReviews.kind, "delivery"),
        eq(customerReviews.moderationStatus, "approved"),
      ),
    );
  const c = Number(row?.n ?? 0);
  const s = row?.s != null ? Number(row.s) : 0;
  if (c === 0) return { count: 0, average: null };
  return { count: c, average: s / c };
}
