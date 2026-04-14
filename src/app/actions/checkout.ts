"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { cartItems, orderItems, orders } from "@/db/schema";
import { getCartId, getCartLines } from "@/lib/cart";
import { releaseExpiredReservations } from "@/lib/reservation";
import { sendOrderConfirmationEmail } from "@/lib/email";

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

  const totalAmount = lines.reduce(
    (sum, l) => sum + l.price * l.quantity,
    0,
  );

  const chatToken = crypto.randomUUID();

  const [order] = await db
    .insert(orders)
    .values({
      status: "new",
      customerName: parsed.data.customerName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      telegram: parsed.data.telegram ?? null,
      address: parsed.data.address ?? null,
      comment: parsed.data.comment ?? null,
      totalAmount,
      chatToken,
    })
    .returning({ id: orders.id });

  if (!order) {
    return { error: "Не удалось создать заказ" };
  }

  await db.insert(orderItems).values(
    lines.map((l) => ({
      orderId: order.id,
      productId: l.productId,
      quantity: l.quantity,
      priceAtOrder: l.price,
    })),
  );

  await db.delete(cartItems).where(eq(cartItems.cartId, cartId));

  revalidatePath("/");
  revalidatePath("/cart");
  revalidatePath("/catalog");
  revalidatePath("/admin/products");

  // Send confirmation email with chat link (non-blocking)
  sendOrderConfirmationEmail({
    to: parsed.data.email,
    customerName: parsed.data.customerName,
    orderId: order.id,
    chatToken,
  }).catch(() => {});

  redirect(`/checkout/success?order=${order.id}&token=${chatToken}`);
}
