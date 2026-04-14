"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { cartItems, products } from "@/db/schema";
import { getOrCreateCartId, getCartId, touchCart } from "@/lib/cart";
import { releaseExpiredReservations, RESERVATION_MS } from "@/lib/reservation";

export async function addToCart(formData: FormData) {
  const raw = formData.get("productId");
  const productId = Number(typeof raw === "string" ? raw : NaN);
  if (!Number.isFinite(productId) || productId < 1) return;

  // Clean up expired reservations so stock figures are accurate
  await releaseExpiredReservations();

  const cartId = await getOrCreateCartId();

  const [product] = await db
    .select({ stock: products.stock, isActive: products.isActive })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!product || !product.isActive) return;

  const existing = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)))
    .limit(1);

  const reservedUntil = new Date(Date.now() + RESERVATION_MS);

  if (existing.length) {
    const item = existing[0];
    // Units already deducted from stock (0 if this is a legacy item without a reservation)
    const alreadyReserved = item.reservedUntil != null ? item.quantity : 0;
    // We need one extra unit from the available stock
    const toDeduct = item.quantity + 1 - alreadyReserved;

    if (product.stock < toDeduct) return;

    db.transaction((tx) => {
      tx.update(cartItems)
        .set({ quantity: item.quantity + 1, reservedUntil })
        .where(eq(cartItems.id, item.id))
        .run();
      tx.update(products)
        .set({ stock: sql`${products.stock} - ${toDeduct}` })
        .where(eq(products.id, productId))
        .run();
    });
  } else {
    if (product.stock < 1) return;

    db.transaction((tx) => {
      tx.insert(cartItems).values({ cartId, productId, quantity: 1, reservedUntil }).run();
      tx.update(products)
        .set({ stock: sql`${products.stock} - 1` })
        .where(eq(products.id, productId))
        .run();
    });
  }

  await touchCart(cartId);
  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath("/cart");
  revalidatePath("/admin/products");
}

export async function updateCartItemQuantity(formData: FormData) {
  const itemId = Number(formData.get("itemId"));
  const newQty = Number(formData.get("quantity"));
  if (!Number.isFinite(itemId) || !Number.isFinite(newQty)) return;

  const cartId = await getCartId();
  if (!cartId) return;

  const [item] = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cartId)))
    .limit(1);

  if (!item) return;

  // How many units are currently reserved in stock for this item
  const reservedQty = item.reservedUntil != null ? item.quantity : 0;

  if (newQty < 1) {
    // Remove item and restore all reserved stock
    db.transaction((tx) => {
      tx.delete(cartItems).where(eq(cartItems.id, itemId)).run();
      if (reservedQty > 0) {
        tx.update(products)
          .set({ stock: sql`${products.stock} + ${reservedQty}` })
          .where(eq(products.id, item.productId))
          .run();
      }
    });
  } else {
    const reservedUntil = new Date(Date.now() + RESERVATION_MS);
    const delta = newQty - reservedQty;

    if (delta > 0) {
      // Need more units from available stock
      const [product] = await db
        .select({ stock: products.stock })
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (!product || product.stock < delta) return;

      db.transaction((tx) => {
        tx.update(cartItems)
          .set({ quantity: newQty, reservedUntil })
          .where(eq(cartItems.id, itemId))
          .run();
        tx.update(products)
          .set({ stock: sql`${products.stock} - ${delta}` })
          .where(eq(products.id, item.productId))
          .run();
      });
    } else {
      // Release excess units back to stock (delta <= 0)
      const restore = -delta;
      db.transaction((tx) => {
        tx.update(cartItems)
          .set({ quantity: newQty, reservedUntil })
          .where(eq(cartItems.id, itemId))
          .run();
        if (restore > 0) {
          tx.update(products)
            .set({ stock: sql`${products.stock} + ${restore}` })
            .where(eq(products.id, item.productId))
            .run();
        }
      });
    }
  }

  await touchCart(cartId);
  revalidatePath("/cart");
  revalidatePath("/admin/products");
}

export async function removeCartItem(formData: FormData) {
  const itemId = Number(formData.get("itemId"));
  if (!Number.isFinite(itemId)) return;

  const cartId = await getCartId();
  if (!cartId) return;

  const [item] = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cartId)))
    .limit(1);

  if (!item) return;

  db.transaction((tx) => {
    tx.delete(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cartId)))
      .run();
    // Restore stock only for items that had an active reservation
    if (item.reservedUntil != null) {
      tx.update(products)
        .set({ stock: sql`${products.stock} + ${item.quantity}` })
        .where(eq(products.id, item.productId))
        .run();
    }
  });

  await touchCart(cartId);
  revalidatePath("/cart");
  revalidatePath("/admin/products");
}
