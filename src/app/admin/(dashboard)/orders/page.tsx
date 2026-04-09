import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Заказы" };

const statusLabel: Record<string, string> = {
  new: "Новый",
  processing: "В работе",
  shipped: "Отправлен",
};

export default async function AdminOrdersPage() {
  const list = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt));

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-heading">Заказы</h1>
      <div className="mt-8 overflow-x-auto rounded-xl border border-brand-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-surface/80 text-brand-muted">
            <tr>
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Дата</th>
              <th className="px-4 py-2">Клиент</th>
              <th className="px-4 py-2">Сумма</th>
              <th className="px-4 py-2">Статус</th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id} className="border-t border-brand-border">
                <td className="px-4 py-2">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="font-mono text-brand hover:underline"
                  >
                    {o.id}
                  </Link>
                </td>
                <td className="px-4 py-2 text-brand-muted">
                  {o.createdAt instanceof Date
                    ? o.createdAt.toLocaleString("ru-RU")
                    : ""}
                </td>
                <td className="px-4 py-2 text-brand-heading">{o.customerName}</td>
                <td className="px-4 py-2">{formatPrice(o.totalAmount)}</td>
                <td className="px-4 py-2 text-brand-muted">
                  {statusLabel[o.status] ?? o.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {list.length === 0 ? (
        <p className="mt-6 text-brand-muted">Заказов пока нет.</p>
      ) : null}
    </div>
  );
}
