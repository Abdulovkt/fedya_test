import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { updateOrderStatus } from "@/app/actions/admin";
import { db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";
import { formatPrice } from "@/lib/format";

type Props = { params: Promise<{ id: string }> };

const statusLabel: Record<string, string> = {
  new: "Новый",
  processing: "В работе",
  shipped: "Отправлен",
};

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const oid = Number(id);
  if (!Number.isFinite(oid)) notFound();

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, oid))
    .limit(1);
  if (!order) notFound();

  const items = await db
    .select({
      quantity: orderItems.quantity,
      priceAtOrder: orderItems.priceAtOrder,
      productName: products.name,
      productId: products.id,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, oid));

  return (
    <div>
      <Link
        href="/admin/orders"
        className="text-sm text-brand hover:underline"
      >
        ← Все заказы
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-brand-heading">
        Заказ #{order.id}
      </h1>
      <p className="mt-1 text-sm text-brand-muted">
        {order.createdAt instanceof Date
          ? order.createdAt.toLocaleString("ru-RU")
          : ""}
      </p>

      <div className="mt-6 rounded-xl border border-brand-border bg-brand-surface/40 p-5">
        <h2 className="text-sm font-semibold text-brand-muted">Статус</h2>
        <form action={updateOrderStatus} className="mt-2 flex flex-wrap items-center gap-3">
          <input type="hidden" name="orderId" value={order.id} />
          <select
            name="status"
            defaultValue={order.status}
            className="rounded border border-brand-border bg-brand-surface px-2 py-1.5 text-sm text-brand-heading"
          >
            <option value="new">{statusLabel.new}</option>
            <option value="processing">{statusLabel.processing}</option>
            <option value="shipped">{statusLabel.shipped}</option>
          </select>
          <button
            type="submit"
            className="rounded bg-brand px-3 py-1.5 text-sm font-semibold text-white"
          >
            Сохранить
          </button>
        </form>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-brand-border p-5">
          <h2 className="text-sm font-semibold text-brand-muted">Контакты</h2>
          <p className="mt-2 text-brand-heading">{order.customerName}</p>
          <p className="text-brand-muted">{order.phone}</p>
          <p className="text-brand-muted">{order.email}</p>
          {order.telegram ? (
            <p className="text-brand-teal">
              <a
                href={`https://t.me/${order.telegram.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {order.telegram.startsWith("@") ? order.telegram : `@${order.telegram}`}
              </a>
            </p>
          ) : null}
          {order.address ? (
            <p className="mt-2 text-sm text-brand-heading">{order.address}</p>
          ) : null}
          {order.comment ? (
            <p className="mt-2 text-sm text-brand-muted">
              Комментарий: {order.comment}
            </p>
          ) : null}
        </div>
        <div className="rounded-xl border border-brand-border p-5">
          <h2 className="text-sm font-semibold text-brand-muted">Итого</h2>
          <p className="mt-2 text-xl font-bold text-brand">
            {formatPrice(order.totalAmount)}
          </p>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-brand-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-surface/80 text-brand-muted">
            <tr>
              <th className="px-4 py-2">Товар</th>
              <th className="px-4 py-2">Кол-во</th>
              <th className="px-4 py-2">Цена</th>
              <th className="px-4 py-2">Сумма</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row, i) => (
              <tr key={`${row.productId}-${i}`} className="border-t border-brand-border">
                <td className="px-4 py-2 text-brand-heading">{row.productName}</td>
                <td className="px-4 py-2">{row.quantity}</td>
                <td className="px-4 py-2">{formatPrice(row.priceAtOrder)}</td>
                <td className="px-4 py-2">
                  {formatPrice(row.priceAtOrder * row.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
