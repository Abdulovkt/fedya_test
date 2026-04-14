import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { cartItems, carts, products } from "@/db/schema";
import { releaseExpiredReservations } from "@/lib/reservation";

const CART_COOKIE = "cart_id";
const CART_MAX_AGE = 60 * 60 * 24 * 30;

export async function getOrCreateCartId(): Promise<string> {
  const cookieStore = await cookies();
  let id = cookieStore.get(CART_COOKIE)?.value;
  if (id) {
    const existing = await db
      .select()
      .from(carts)
      .where(eq(carts.id, id))
      .limit(1);
    if (existing.length) return id;
  }
  id = crypto.randomUUID();
  await db.insert(carts).values({ id });
  cookieStore.set(CART_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: CART_MAX_AGE,
  });
  return id;
}

export async function getCartId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const id = cookieStore.get(CART_COOKIE)?.value;
  if (!id) return undefined;
  const existing = await db
    .select()
    .from(carts)
    .where(eq(carts.id, id))
    .limit(1);
  return existing.length ? id : undefined;
}

export type CartLine = {
  itemId: number;
  productId: number;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  reservedUntil: Date | null;
};

export async function getCartLines(): Promise<CartLine[]> {
  // Release any expired reservations before reading so the cart is always fresh
  await releaseExpiredReservations();

  const cartId = await getCartId();
  if (!cartId) return [];

  const rows = await db
    .select({
      itemId: cartItems.id,
      productId: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      quantity: cartItems.quantity,
      imageUrl: products.imageUrl,
      reservedUntil: cartItems.reservedUntil,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.cartId, cartId));

  return rows.map((r) => ({
    itemId: r.itemId,
    productId: r.productId,
    name: r.name,
    slug: r.slug,
    price: r.price,
    quantity: r.quantity,
    imageUrl: r.imageUrl,
    reservedUntil: r.reservedUntil,
  }));
}

export async function getCartItemCount(): Promise<number> {
  const lines = await getCartLines();
  return lines.reduce((s, l) => s + l.quantity, 0);
}

export async function touchCart(cartId: string) {
  await db
    .update(carts)
    .set({ updatedAt: new Date() })
    .where(eq(carts.id, cartId));
}
