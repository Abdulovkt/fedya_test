"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { cartItems } from "@/db/schema";
import { getOrCreateCartId, getCartId, touchCart } from "@/lib/cart";

export async function addToCart(formData: FormData) {
  const raw = formData.get("productId");
  const productId = Number(typeof raw === "string" ? raw : NaN);
  if (!Number.isFinite(productId) || productId < 1) return;

  const cartId = await getOrCreateCartId();
  const existing = await db
    .select()
    .from(cartItems)
    .where(
      and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)),
    )
    .limit(1);

  if (existing.length) {
    await db
      .update(cartItems)
      .set({ quantity: existing[0].quantity + 1 })
      .where(eq(cartItems.id, existing[0].id));
  } else {
    await db.insert(cartItems).values({ cartId, productId, quantity: 1 });
  }
  await touchCart(cartId);
  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath("/cart");
}

export async function updateCartItemQuantity(formData: FormData) {
  const itemId = Number(formData.get("itemId"));
  const quantity = Number(formData.get("quantity"));
  if (!Number.isFinite(itemId) || !Number.isFinite(quantity)) return;

  const cartId = await getCartId();
  if (!cartId) return;

  if (quantity < 1) {
    await db.delete(cartItems).where(eq(cartItems.id, itemId));
  } else {
    await db
      .update(cartItems)
      .set({ quantity })
      .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cartId)));
  }
  await touchCart(cartId);
  revalidatePath("/cart");
}

export async function removeCartItem(formData: FormData) {
  const itemId = Number(formData.get("itemId"));
  if (!Number.isFinite(itemId)) return;
  const cartId = await getCartId();
  if (!cartId) return;
  await db
    .delete(cartItems)
    .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cartId)));
  await touchCart(cartId);
  revalidatePath("/cart");
}
