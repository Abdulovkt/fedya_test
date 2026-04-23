"use server";

import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { customerReviews, orders, products } from "@/db/schema";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session;
}

export type ModerateReviewState = { ok?: true; error?: string } | null;

const moderateSchema = z.object({
  id: z.coerce.number().int().positive(),
  action: z.enum(["approve", "reject"]),
  rejectionReason: z.string().max(500).optional(),
});

export async function moderateCustomerReview(
  _prev: ModerateReviewState,
  formData: FormData,
): Promise<ModerateReviewState> {
  await requireAdmin();

  const parsed = moderateSchema.safeParse({
    id: formData.get("id"),
    action: formData.get("action"),
    rejectionReason: formData.get("rejectionReason")?.toString() ?? "",
  });
  if (!parsed.success) {
    return { error: "Некорректные данные" };
  }

  const [row] = await db
    .select({
      id: customerReviews.id,
      productId: customerReviews.productId,
      kind: customerReviews.kind,
    })
    .from(customerReviews)
    .where(eq(customerReviews.id, parsed.data.id))
    .limit(1);

  if (!row) {
    return { error: "Отзыв не найден" };
  }

  if (parsed.data.action === "approve") {
    await db
      .update(customerReviews)
      .set({
        moderationStatus: "approved",
        rejectionReason: null,
        updatedAt: new Date(),
      })
      .where(eq(customerReviews.id, row.id));
  } else {
    await db
      .update(customerReviews)
      .set({
        moderationStatus: "rejected",
        rejectionReason: parsed.data.rejectionReason?.trim() || "Отклонён",
        updatedAt: new Date(),
      })
      .where(eq(customerReviews.id, row.id));
  }

  revalidatePath("/admin/reviews");
  revalidatePath("/reviews/delivery");
  revalidatePath("/catalog");
  revalidatePath("/");
  if (row.productId) {
    const [p] = await db
      .select({ slug: products.slug })
      .from(products)
      .where(eq(products.id, row.productId))
      .limit(1);
    if (p) revalidatePath(`/product/${p.slug}`);
  }
  return { ok: true };
}

export async function listCustomerReviewsForAdmin(filter: "pending" | "all" = "pending") {
  await requireAdmin();
  const base = () =>
    db
      .select({
        id: customerReviews.id,
        kind: customerReviews.kind,
        reviewKey: customerReviews.reviewKey,
        orderId: customerReviews.orderId,
        productId: customerReviews.productId,
        rating: customerReviews.rating,
        text: customerReviews.text,
        photoUrls: customerReviews.photoUrls,
        moderationStatus: customerReviews.moderationStatus,
        rejectionReason: customerReviews.rejectionReason,
        createdAt: customerReviews.createdAt,
        customerName: orders.customerName,
        publicOrderNumber: orders.publicOrderNumber,
      })
      .from(customerReviews)
      .innerJoin(orders, eq(customerReviews.orderId, orders.id));

  if (filter === "pending") {
    return base()
      .where(eq(customerReviews.moderationStatus, "pending"))
      .orderBy(desc(customerReviews.createdAt));
  }
  return base().orderBy(desc(customerReviews.createdAt));
}
