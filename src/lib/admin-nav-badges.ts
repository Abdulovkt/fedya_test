import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { customerReviews, products } from "@/db/schema";
import { ADMIN_LOW_STOCK_MAX, type AdminNavBadgeCounts } from "./admin-nav-badges-types";

export { ADMIN_LOW_STOCK_MAX, type AdminNavBadgeCounts } from "./admin-nav-badges-types";

/**
 * Счётчики для бейджей в боковом меню админки. Запрашивать в layout.
 */
export async function getAdminNavBadgeCounts(): Promise<AdminNavBadgeCounts> {
  const chatUnreadRows = await db.all(sql`
    SELECT COUNT(*) as c
    FROM chat_messages cm
    JOIN orders o ON o.id = cm.order_id
    WHERE cm.sender = 'customer'
      AND cm.created_at > COALESCE(o.admin_last_read_at, 0)
  `);
  const chatUnread = Number(
    (chatUnreadRows[0] as { c: number } | undefined)?.c ?? 0,
  );

  const [oosRow] = await db
    .select({ n: count() })
    .from(products)
    .where(and(eq(products.isActive, true), eq(products.stock, 0)));

  const [lowRow] = await db
    .select({ n: count() })
    .from(products)
    .where(
      and(
        eq(products.isActive, true),
        gte(products.stock, 1),
        lte(products.stock, ADMIN_LOW_STOCK_MAX),
      ),
    );

  const [revRow] = await db
    .select({ n: count() })
    .from(customerReviews)
    .where(eq(customerReviews.moderationStatus, "pending"));

  return {
    chatUnread,
    productOutOfStock: Number(oosRow?.n ?? 0),
    productLowStock: Number(lowRow?.n ?? 0),
    reviewsPending: Number(revRow?.n ?? 0),
  };
}
