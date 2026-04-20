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
import { getCartPricing } from "@/lib/pricing";
import { getPromoValidationError, hasPromoBeenUsedByCustomer } from "@/lib/promocodes";
import { createPayPassRequest } from "@/lib/paypass";

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Укажите имя"),
  phone: z.string().min(10, "Укажите телефон"),
  email: z.string().email("Некорректный email"),
  telegram: z.string().optional(),
  address: z.string().optional(),
  comment: z.string().optional(),
});

export type CheckoutState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

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

  const pricing = getCartPricing(lines, appliedPromo);
  const normalizedEmail = parsed.data.email.trim().toLowerCase();

  const chatToken = crypto.randomUUID();

  const [order] = await db
    .insert(orders)
    .values({
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
      totalAmount: pricing.finalTotal,
      chatToken,
    })
    .returning({ id: orders.id });

  if (!order) {
    return { error: "Не удалось создать заказ" };
  }

  const paypassClientRequestId = `ORDER-${order.id}`;
  try {
    const paypass = await createPayPassRequest({
      amountRub: pricing.finalTotal / 100,
      clientRequestId: paypassClientRequestId,
      comment: `Заказ #${order.id}`,
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
    chatToken,
  }).catch(() => {});

  redirect(`/checkout/success?order=${order.id}&token=${chatToken}`);
}
