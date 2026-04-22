"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { cartItems, carts, orderItems, orders, promoCodeUsages } from "@/db/schema";
import { getCartId, getCartLines, getCartPromoCode } from "@/lib/cart";
import { releaseExpiredReservations } from "@/lib/reservation";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { getCheckoutAmounts, type PriceLine } from "@/lib/pricing";
import { getPromoValidationError, hasPromoBeenUsedByCustomer } from "@/lib/promocodes";
import { getSettings, getDeliveryFeesKopecksFromSettings } from "@/lib/settings";
import { createPayPassRequest } from "@/lib/paypass";
import {
  buildPublicPayPassClientRequestId,
  generateUniquePublicOrderNumber,
} from "@/lib/order-number";

const CDEK_PVZ_MAX_LEN = 2000;

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Укажите имя"),
  phone: z.string().min(10, "Укажите телефон"),
  email: z.string().email("Некорректный email"),
  telegram: z.string().optional(),
  address: z.string().optional(),
  comment: z.string().optional(),
  cdekPickupPoint: z
    .string()
    .max(CDEK_PVZ_MAX_LEN, "Слишком длинный текст пункта выдачи"),
});

export type CheckoutState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function isPublicOrderNumberUniqueError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("orders.public_order_number") ||
    message.includes("orders_public_order_number_idx")
  );
}

export async function placeOrder(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const parsed = checkoutSchema.safeParse({
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    telegram: formData.get("telegram") || undefined,
    address: formData.get("address") || undefined,
    comment: formData.get("comment") || undefined,
    cdekPickupPoint: formData.get("cdekPickupPoint")?.toString() ?? "",
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  // Release any items whose reservation expired before we read the cart
  await releaseExpiredReservations();

  const cartId = await getCartId();
  if (!cartId) {
    return { error: "Корзина пуста" };
  }

  const lines = await getCartLines();
  if (!lines.length) {
    return { error: "Корзина пуста" };
  }

  const appliedPromo = await getCartPromoCode();
  if (appliedPromo) {
    const validationError = getPromoValidationError(lines, appliedPromo);
    if (validationError) {
      await db
        .update(carts)
        .set({ appliedPromoCodeId: null, updatedAt: new Date() })
        .where(eq(carts.id, cartId));
      return { error: validationError };
    }

    const alreadyUsed = await hasPromoBeenUsedByCustomer(appliedPromo.id, {
      email: parsed.data.email,
      customerName: parsed.data.customerName,
      address: parsed.data.address,
    });
    if (alreadyUsed) {
      return {
        error:
          "Этот промокод уже был использован ранее для этого покупателя. Уберите его или введите другой промокод.",
      };
    }
  }

  const settings = await getSettings();
  const fees = getDeliveryFeesKopecksFromSettings(settings);
  const priceLines: PriceLine[] = lines.map((l) => ({
    productId: l.productId,
    price: l.price,
    quantity: l.quantity,
  }));
  const amounts = getCheckoutAmounts(priceLines, lines, appliedPromo, {
    postKopecks: fees.postKopecks,
    cdekKopecks: fees.cdekKopecks,
  });
  const pricing = amounts.pricing;

  const cdekTrimmed = (parsed.data.cdekPickupPoint ?? "").trim();
  if (amounts.delivery.hasCdek) {
    if (!cdekTrimmed) {
      return {
        fieldErrors: { cdekPickupPoint: ["Укажите пункт выдачи СДЭК (адрес, код ПВЗ)"] },
      };
    }
  }

  const normalizedEmail = parsed.data.email.trim().toLowerCase();

  const chatToken = crypto.randomUUID();

  let order: { id: number; publicOrderNumber: string | null } | undefined;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const publicOrderNumber = await generateUniquePublicOrderNumber();
    try {
      [order] = await db
        .insert(orders)
        .values({
          publicOrderNumber,
          status: "new",
          paymentStatus: "pending",
          customerName: parsed.data.customerName,
          phone: parsed.data.phone,
          email: normalizedEmail,
          telegram: parsed.data.telegram ?? null,
          address: parsed.data.address ?? null,
          comment: parsed.data.comment ?? null,
          subtotalAmount: pricing.subtotal,
          autoDiscountAmount: pricing.autoDiscountAmount,
          promoCode: pricing.appliedPromoCode,
          promoDiscountAmount: pricing.promoDiscountAmount,
          promoDiscountPercent: pricing.promoDiscountPercent,
          appliedDiscountMode: pricing.appliedDiscountMode,
          deliveryPostKopecks: amounts.delivery.postKopecks,
          deliveryCdekKopecks: amounts.delivery.cdekKopecks,
          cdekPickupPoint: amounts.delivery.hasCdek ? cdekTrimmed : null,
          totalAmount: amounts.payableTotalKopecks,
          chatToken,
        })
        .returning({ id: orders.id, publicOrderNumber: orders.publicOrderNumber });
      break;
    } catch (error) {
      if (!isPublicOrderNumberUniqueError(error)) {
        throw error;
      }
    }
  }

  if (!order) {
    return { error: "Не удалось создать заказ" };
  }

  const publicOrderNumber = order.publicOrderNumber ?? `#${order.id}`;
  const paypassClientRequestId = buildPublicPayPassClientRequestId(publicOrderNumber);
  try {
    const paypass = await createPayPassRequest({
      amountRub: amounts.payableTotalKopecks / 100,
      clientRequestId: paypassClientRequestId,
      comment: `Заказ ${publicOrderNumber}`,
      clientFio: parsed.data.customerName,
      clientPhone: parsed.data.phone,
    });
    await db
      .update(orders)
      .set({
        paypassPublicId: paypass.publicId,
        paypassClientRequestId,
        paypassTelegramLink: paypass.telegramLink,
        paypassStatus: paypass.status,
        paypassLastCheckedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));
  } catch {
    await db
      .update(orders)
      .set({
        paymentStatus: "unpaid",
        paymentFailureReason: "paypass_create_error",
        paypassClientRequestId,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));
  }

  await db.insert(orderItems).values(
    lines.map((l) => ({
      orderId: order.id,
      productId: l.productId,
      quantity: l.quantity,
      priceAtOrder: l.price,
    })),
  );

  if (appliedPromo && pricing.appliedDiscountMode === "promo") {
    await db.insert(promoCodeUsages).values({
      promoCodeId: appliedPromo.id,
      orderId: order.id,
      email: normalizedEmail,
    });
  }

  await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
  await db
    .update(carts)
    .set({ appliedPromoCodeId: null, updatedAt: new Date() })
    .where(eq(carts.id, cartId));

  revalidatePath("/");
  revalidatePath("/cart");
  revalidatePath("/checkout");
  revalidatePath("/catalog");
  revalidatePath("/admin/products");
  revalidatePath("/admin/orders");

  // Send confirmation email with chat link (non-blocking)
  sendOrderConfirmationEmail({
    to: normalizedEmail,
    customerName: parsed.data.customerName,
    orderId: order.id,
    orderNumber: publicOrderNumber,
    orderRef: order.publicOrderNumber ?? String(order.id),
    chatToken,
  }).catch(() => {});

  redirect(`/checkout/success?order=${encodeURIComponent(publicOrderNumber)}&token=${chatToken}`);
}
