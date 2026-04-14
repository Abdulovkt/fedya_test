import { and, eq, isNotNull, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { cartItems, products } from "@/db/schema";

export const RESERVATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Finds all cart items whose reservation has expired, restores their stock,
 * and deletes them from the cart. Should be called lazily before any
 * operation that reads or modifies stock/cart state.
 */
export async function releaseExpiredReservations(): Promise<void> {
  const now = new Date();

  const expired = await db
    .select({
      id: cartItems.id,
      productId: cartItems.productId,
      quantity: cartItems.quantity,
    })
    .from(cartItems)
    .where(and(isNotNull(cartItems.reservedUntil), lt(cartItems.reservedUntil, now)));

  if (!expired.length) return;

  // Aggregate quantities per product to minimise UPDATE statements
  const restoreMap = new Map<number, number>();
  for (const item of expired) {
    restoreMap.set(item.productId, (restoreMap.get(item.productId) ?? 0) + item.quantity);
  }

  db.transaction((tx) => {
    for (const [productId, qty] of restoreMap) {
      tx.update(products)
        .set({ stock: sql`${products.stock} + ${qty}` })
        .where(eq(products.id, productId))
        .run();
    }
    // Re-use same cutoff so we don't accidentally delete newly-added items
    tx.delete(cartItems)
      .where(and(isNotNull(cartItems.reservedUntil), lt(cartItems.reservedUntil, now)))
      .run();
  });
}
