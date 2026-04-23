import { notFound } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { customerReviews, orderItems, orders, products } from "@/db/schema";
import { findOrderIdentity, getDisplayOrderNumber } from "@/lib/order-number";
import { getSettings } from "@/lib/settings";
import {
  canSubmitDeliveryReview,
  canSubmitProductReview,
  reviewProductMinDaysFromSettings,
} from "@/lib/review-policy";
import { OrderReviewForms } from "@/components/shop/OrderReviewForms";

type Props = {
  params: Promise<{ orderRef: string }>;
  searchParams: Promise<{ token?: string }>;
};

export const metadata = { title: "Отзыв о доставке и товарах" };

export default async function OrderReviewsPage({ params, searchParams }: Props) {
  const { orderRef } = await params;
  const { token } = await searchParams;
  if (!token) notFound();

  const identity = await findOrderIdentity(orderRef);
  if (!identity) notFound();

  const [order] = await db
    .select({
      id: orders.id,
      publicOrderNumber: orders.publicOrderNumber,
      customerName: orders.customerName,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      chatToken: orders.chatToken,
      deliveredAt: orders.deliveredAt,
      updatedAt: orders.updatedAt,
    })
    .from(orders)
    .where(eq(orders.id, identity.id))
    .limit(1);

  if (!order || !order.chatToken || order.chatToken !== token) notFound();

  const settings = await getSettings();
  const minDays = reviewProductMinDaysFromSettings(
    settings.review_product_min_days_after_delivered,
  );

  const [deliveryRow] = await db
    .select({
      id: customerReviews.id,
      moderationStatus: customerReviews.moderationStatus,
    })
    .from(customerReviews)
    .where(
      and(eq(customerReviews.orderId, order.id), eq(customerReviews.kind, "delivery")),
    )
    .limit(1);

  const lineRows = await db
    .select({
      id: orderItems.id,
      productId: orderItems.productId,
      productName: products.name,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, order.id));

  const lineIds = lineRows.map((l) => l.id);
  const productReviewRows =
    lineIds.length > 0
      ? await db
          .select({
            orderItemId: customerReviews.orderItemId,
            moderationStatus: customerReviews.moderationStatus,
          })
          .from(customerReviews)
          .where(
            and(
              eq(customerReviews.orderId, order.id),
              eq(customerReviews.kind, "product"),
              inArray(customerReviews.orderItemId, lineIds),
            ),
          )
      : [];

  const byLineId = new Map(
    productReviewRows
      .filter((r) => r.orderItemId != null)
      .map((r) => [r.orderItemId as number, r.moderationStatus]),
  );

  const canWriteDelivery = canSubmitDeliveryReview(order) && !deliveryRow;
  const canWriteProduct = (lineId: number) => {
    if (byLineId.has(lineId)) return false;
    return canSubmitProductReview(
      {
        status: order.status,
        paymentStatus: order.paymentStatus,
        deliveredAt: order.deliveredAt,
        updatedAt: order.updatedAt,
      },
      minDays,
    );
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-brand-heading">Отзыв о заказе</h1>
      <p className="mt-1 text-sm text-brand-muted">
        {order.customerName}, заказ {getDisplayOrderNumber(order)}. Спасибо, что выбираете нас — ваши
        отзывы публикуются после проверки.
      </p>
      {order.status !== "delivered" && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Отзыв можно оставить после доставки заказа. Сейчас статус: «{order.status}».
        </p>
      )}

      <OrderReviewForms
        orderRef={orderRef}
        token={token}
        minDaysAfterDelivery={minDays}
        canSubmitDelivery={canWriteDelivery}
        deliveryExist={deliveryRow}
        lines={lineRows.map((l) => ({
          id: l.id,
          productName: l.productName,
          canWrite: canWriteProduct(l.id),
          existing: byLineId.get(l.id) ?? null,
        }))}
      />
    </div>
  );
}
