import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";
import { OrdersTable } from "@/components/admin/OrdersTable";

export const metadata = { title: "Заказы" };

export default async function AdminOrdersPage() {
  const list = await db.select().from(orders).orderBy(desc(orders.createdAt));

  const allItems = await db
    .select({
      orderId: orderItems.orderId,
      productName: products.name,
      quantity: orderItems.quantity,
      priceAtOrder: orderItems.priceAtOrder,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id));

  const itemsByOrder = new Map<number, typeof allItems>();
  for (const item of allItems) {
    const arr = itemsByOrder.get(item.orderId) ?? [];
    arr.push(item);
    itemsByOrder.set(item.orderId, arr);
  }

  const ordersWithItems = list.map((o) => ({
    ...o,
    items: itemsByOrder.get(o.id) ?? [],
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-heading">Заказы</h1>
      <div className="mt-8">
        {list.length === 0 ? (
          <p className="text-brand-muted">Заказов пока нет.</p>
        ) : (
          <OrdersTable orders={ordersWithItems} />
        )}
      </div>
    </div>
  );
}
