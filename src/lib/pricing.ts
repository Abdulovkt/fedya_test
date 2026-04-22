import type { PromoCodeRecord } from "@/lib/promocodes";
import { getDeliveryBreakdown, type LineWithFulfillment } from "@/lib/shipping";

export type DiscountRule = {
  minAmount: number;
  percent: number;
};

export const DISCOUNT_RULES: readonly DiscountRule[] = [
  { minAmount: 100_000 * 100, percent: 30 },
  { minAmount: 50_000 * 100, percent: 20 },
  { minAmount: 30_000 * 100, percent: 15 },
  { minAmount: 20_000 * 100, percent: 10 },
] as const;

export type PriceLine = {
  productId: number;
  price: number;
  quantity: number;
};

export type PricingSummary = {
  subtotal: number;
  finalTotal: number;
  appliedDiscountMode: "none" | "auto" | "promo";
  autoDiscountRate: number;
  autoDiscountAmount: number;
  availableAutoDiscountAmount: number;
  promoDiscountPercent: number;
  promoDiscountAmount: number;
  appliedPromoCode: string | null;
  promoEligibleSubtotal: number;
  hasDiscount: boolean;
};

export function getDiscountRate(subtotal: number): number {
  for (const rule of DISCOUNT_RULES) {
    if (subtotal >= rule.minAmount) {
      return rule.percent;
    }
  }

  return 0;
}

function getPromoEligibleSubtotal(lines: PriceLine[], promo: PromoCodeRecord): number {
  return lines.reduce((sum, line) => {
    if (!promo.appliesToAll && !promo.productIds.includes(line.productId)) {
      return sum;
    }

    return sum + line.price * line.quantity;
  }, 0);
}

export function getPricingFromSubtotal(subtotal: number): PricingSummary {
  const autoDiscountRate = getDiscountRate(subtotal);
  const availableAutoDiscountAmount = Math.round((subtotal * autoDiscountRate) / 100);
  const hasDiscount = availableAutoDiscountAmount > 0;

  return {
    subtotal,
    finalTotal: subtotal - availableAutoDiscountAmount,
    appliedDiscountMode: hasDiscount ? "auto" : "none",
    autoDiscountRate,
    autoDiscountAmount: availableAutoDiscountAmount,
    availableAutoDiscountAmount,
    promoDiscountPercent: 0,
    promoDiscountAmount: 0,
    appliedPromoCode: null,
    promoEligibleSubtotal: 0,
    hasDiscount,
  };
}

export function getPricingFromLines(
  lines: PriceLine[],
  promo: PromoCodeRecord | null = null,
): PricingSummary {
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const basePricing = getPricingFromSubtotal(subtotal);

  if (!promo) {
    return basePricing;
  }

  const promoEligibleSubtotal = getPromoEligibleSubtotal(lines, promo);
  const promoDiscountAmount = Math.round(
    (promoEligibleSubtotal * promo.discountPercent) / 100,
  );
  if (promoDiscountAmount <= 0) {
    return basePricing;
  }

  return {
    subtotal,
    finalTotal: subtotal - promoDiscountAmount,
    appliedDiscountMode: "promo",
    autoDiscountRate: basePricing.autoDiscountRate,
    autoDiscountAmount: 0,
    availableAutoDiscountAmount: basePricing.availableAutoDiscountAmount,
    promoDiscountPercent: promo.discountPercent,
    promoDiscountAmount,
    appliedPromoCode: promo.code,
    promoEligibleSubtotal,
    hasDiscount: true,
  };
}

export function getPricingFromStoredOrder({
  subtotal,
  autoDiscountAmount,
  promoCode,
  promoDiscountAmount,
  promoDiscountPercent,
  totalAmount,
}: {
  subtotal: number;
  autoDiscountAmount: number;
  promoCode: string | null;
  promoDiscountAmount: number;
  promoDiscountPercent: number;
  totalAmount: number;
}): PricingSummary {
  const autoDiscountRate =
    subtotal > 0 ? Math.round((autoDiscountAmount / subtotal) * 100) : 0;
  const appliedDiscountMode =
    promoDiscountAmount > 0 ? "promo" : autoDiscountAmount > 0 ? "auto" : "none";

  return {
    subtotal,
    finalTotal: totalAmount,
    appliedDiscountMode,
    autoDiscountRate,
    autoDiscountAmount,
    availableAutoDiscountAmount: autoDiscountAmount,
    promoDiscountPercent,
    promoDiscountAmount,
    appliedPromoCode: promoCode,
    promoEligibleSubtotal: 0,
    hasDiscount: autoDiscountAmount > 0 || promoDiscountAmount > 0,
  };
}

export function getCartPricing(
  lines: PriceLine[],
  promo: PromoCodeRecord | null = null,
): PricingSummary {
  return getPricingFromLines(lines, promo);
}

export type CheckoutAmounts = {
  pricing: PricingSummary;
  delivery: ReturnType<typeof getDeliveryBreakdown>;
  goodsTotalKopecks: number;
  payableTotalKopecks: number;
};

/** Сумма товаров со скидкой + фиксированная доставка по типам отгрузки в корзине. */
export function getCheckoutAmounts(
  lines: PriceLine[],
  fulfillmentLines: LineWithFulfillment[],
  promo: PromoCodeRecord | null,
  fees: { postKopecks: number; cdekKopecks: number },
): CheckoutAmounts {
  const pricing = getCartPricing(lines, promo);
  const delivery = getDeliveryBreakdown(fulfillmentLines, fees);
  return {
    pricing,
    delivery,
    goodsTotalKopecks: pricing.finalTotal,
    payableTotalKopecks: pricing.finalTotal + delivery.totalDeliveryKopecks,
  };
}

