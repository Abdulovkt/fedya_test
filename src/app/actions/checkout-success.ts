"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { findOrderIdentity } from "@/lib/order-number";
import { syncOrderPaymentStatusById } from "@/lib/paypass-sync";

export async function refreshOrderPaymentSync(orderRef: string, token: string) {
  const trimmedRef = orderRef.trim();
  if (!trimmedRef || !token) {
    return { ok: false as const, reason: "missing_params" };
  }

  const identity = await findOrderIdentity(trimmedRef);
  if (!identity) {
    return { ok: false as const, reason: "order_not_found" };
  }

  const [order] = await db
    .select({
      chatToken: orders.chatToken,
      paymentStatus: orders.paymentStatus,
      paymentMethod: orders.paymentMethod,
    })
    .from(orders)
    .where(eq(orders.id, identity.id))
    .limit(1);

  if (!order || order.chatToken !== token) {
    return { ok: false as const, reason: "invalid_token" };
  }

  if (order.paymentMethod === "bank_transfer") {
    return { ok: true as const, final: true };
  }

  if (order.paymentStatus === "paid" || order.paymentStatus === "failed") {
    return { ok: true as const, final: true };
  }

  await syncOrderPaymentStatusById(identity.id);
  return { ok: true as const, final: false };
}
