"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { customerReviews, orderItems, orders, products } from "@/db/schema";
import { findOrderIdentity } from "@/lib/order-number";
import { getSettings } from "@/lib/settings";
import {
  canSubmitDeliveryReview,
  canSubmitProductReview,
  reviewProductMinDaysFromSettings,
} from "@/lib/review-policy";
import { saveReviewPhotosFromFormData } from "@/lib/uploads";

const MAX_REVIEW_PHOTOS = 5;
const textSchema = z.string().min(1, "Введите текст").max(2000);
const ratingSchema = z.coerce.number().int().min(1).max(5);

type SubmitState = { ok?: true; error?: string } | null;

type LoadedOrder =
  | {
      ok: true;
      order: {
        id: number;
        status: string;
        paymentStatus: string;
        chatToken: string | null;
        deliveredAt: Date | null;
        updatedAt: Date;
        publicOrderNumber: string | null;
      };
    }
  | { ok: false; error: string };

async function loadOrderForReview(orderRef: string, token: string): Promise<LoadedOrder> {
  const orderIdentity = await findOrderIdentity(orderRef);
  if (!orderIdentity) {
    return { ok: false, error: "Заказ не найден" };
  }
  const [order] = await db
    .select({
      id: orders.id,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      chatToken: orders.chatToken,
      deliveredAt: orders.deliveredAt,
      updatedAt: orders.updatedAt,
      publicOrderNumber: orders.publicOrderNumber,
    })
    .from(orders)
    .where(eq(orders.id, orderIdentity.id))
    .limit(1);

  if (!order || !order.chatToken || order.chatToken !== token) {
    return { ok: false, error: "Недействительная ссылка. Откройте письмо с заказом и перейдите по ссылке снова." };
  }
  return { ok: true, order };
}

export async function submitDeliveryReview(
  _prev: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const orderRef = String(formData.get("orderRef") ?? "");
  const token = String(formData.get("token") ?? "");
  const loaded = await loadOrderForReview(orderRef, token);
  if (!loaded.ok) return { error: loaded.error };

  const { order } = loaded;
  if (!canSubmitDeliveryReview(order)) {
    return {
      error:
        "Отзыв о доставке доступен, когда заказ доставлен и оплачен. Статус сейчас не позволяет оставить отзыв.",
    };
  }

  const parsed = z
    .object({
      rating: ratingSchema,
      text: textSchema,
    })
    .safeParse({
      rating: formData.get("rating"),
      text: formData.get("text"),
    });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }

  const reviewKey = `d:${order.id}`;
  const [existing] = await db
    .select({ id: customerReviews.id })
    .from(customerReviews)
    .where(eq(customerReviews.reviewKey, reviewKey))
    .limit(1);
  if (existing) {
    return { error: "Отзыв о доставке по этому заказу уже отправлен" };
  }

  const photos = await saveReviewPhotosFromFormData(formData, MAX_REVIEW_PHOTOS);
  const photoJson = JSON.stringify(photos);

  await db.insert(customerReviews).values({
    reviewKey,
    kind: "delivery",
    orderId: order.id,
    orderItemId: null,
    productId: null,
    rating: parsed.data.rating,
    text: parsed.data.text.trim(),
    photoUrls: photoJson,
    moderationStatus: "pending",
  });

  revalidatePath("/reviews/delivery");
  revalidatePath("/admin/reviews");
  return { ok: true };
}

export async function submitProductReview(
  _prev: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const orderRef = String(formData.get("orderRef") ?? "");
  const token = String(formData.get("token") ?? "");
  const orderItemId = Number(formData.get("orderItemId"));

  const loaded = await loadOrderForReview(orderRef, token);
  if (!loaded.ok) return { error: loaded.error };

  const { order } = loaded;
  const settings = await getSettings();
  const minDays = reviewProductMinDaysFromSettings(settings.review_product_min_days_after_delivered);

  if (!canSubmitProductReview(order, minDays)) {
    if (!canSubmitDeliveryReview(order)) {
      return {
        error:
          "Отзыв о товаре доступен после доставки и оплаты. Сейчас это условие не выполнено.",
      };
    }
    return {
      error: `Отзыв о товаре можно оставить не раньше чем через ${minDays} сут. после доставки.`,
    };
  }

  if (!Number.isFinite(orderItemId) || orderItemId <= 0) {
    return { error: "Некорректная позиция заказа" };
  }

  const [line] = await db
    .select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      productId: orderItems.productId,
    })
    .from(orderItems)
    .where(eq(orderItems.id, orderItemId))
    .limit(1);
  if (!line || line.orderId !== order.id) {
    return { error: "Позиция не относится к этому заказу" };
  }

  const parsed = z
    .object({
      rating: ratingSchema,
      text: textSchema,
    })
    .safeParse({
      rating: formData.get("rating"),
      text: formData.get("text"),
    });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }

  const reviewKey = `p:${line.id}`;
  const [existing] = await db
    .select({ id: customerReviews.id })
    .from(customerReviews)
    .where(eq(customerReviews.reviewKey, reviewKey))
    .limit(1);
  if (existing) {
    return { error: "Отзыв об этом товаре уже отправлен" };
  }

  const [productRow] = await db
    .select({ id: products.id, slug: products.slug })
    .from(products)
    .where(eq(products.id, line.productId))
    .limit(1);
  if (!productRow) {
    return { error: "Товар не найден" };
  }

  const photos = await saveReviewPhotosFromFormData(formData, MAX_REVIEW_PHOTOS);
  const photoJson = JSON.stringify(photos);

  await db.insert(customerReviews).values({
    reviewKey,
    kind: "product",
    orderId: order.id,
    orderItemId: line.id,
    productId: line.productId,
    rating: parsed.data.rating,
    text: parsed.data.text.trim(),
    photoUrls: photoJson,
    moderationStatus: "pending",
  });

  revalidatePath(`/product/${productRow.slug}`);
  revalidatePath("/");
  revalidatePath("/admin/reviews");
  return { ok: true };
}

export type { SubmitState as ReviewSubmitState };
