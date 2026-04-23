/** Можно ли оставить отзыв о доставке (без задержки «после использования»). */
export function canSubmitDeliveryReview(order: {
  status: string;
  paymentStatus: string;
}): boolean {
  return order.status === "delivered" && order.paymentStatus === "paid";
}

/**
 * Можно ли оставить отзыв о товаре с учётом дней после доставки
 * (настройка `review_product_min_days_after_delivered`, 0 = сразу после доставки).
 */
export function canSubmitProductReview(
  order: {
    status: string;
    paymentStatus: string;
    deliveredAt: Date | null;
    updatedAt: Date;
  },
  minDaysAfterDelivered: number,
  now: Date = new Date(),
): boolean {
  if (!canSubmitDeliveryReview(order)) return false;
  if (minDaysAfterDelivered <= 0) return true;
  const anchor = order.deliveredAt?.getTime() ?? order.updatedAt.getTime();
  const ms = minDaysAfterDelivered * 24 * 60 * 60 * 1000;
  return now.getTime() >= anchor + ms;
}

export function reviewProductMinDaysFromSettings(
  value: string | undefined,
): number {
  const n = Number(String(value ?? "0").trim());
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.floor(n), 3650);
}
