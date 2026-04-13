import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { AdminChatBox } from "@/components/admin/AdminChatBox";

type Props = { params: Promise<{ orderId: string }> };

export default async function AdminChatDetailPage({ params }: Props) {
  const { orderId } = await params;
  const oid = Number(orderId);
  if (!Number.isFinite(oid)) notFound();

  const [order] = await db
    .select({
      id: orders.id,
      customerName: orders.customerName,
      phone: orders.phone,
      email: orders.email,
      telegram: orders.telegram,
    })
    .from(orders)
    .where(eq(orders.id, oid))
    .limit(1);

  if (!order) notFound();

  return (
    <div>
      <Link href="/admin/chats" className="text-sm text-brand hover:underline">
        ← Все диалоги
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-heading">
            {order.customerName}
          </h1>
          <div className="mt-1 flex flex-wrap gap-3 text-sm text-brand-muted">
            <span>{order.phone}</span>
            <span>{order.email}</span>
            {order.telegram && (
              <a
                href={`https://t.me/${order.telegram.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-teal hover:underline"
              >
                {order.telegram.startsWith("@") ? order.telegram : `@${order.telegram}`}
              </a>
            )}
          </div>
        </div>
        <Link
          href={`/admin/orders/${order.id}`}
          className="rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-muted hover:border-brand/40 hover:text-brand"
        >
          Заказ #{order.id} →
        </Link>
      </div>

      <div className="mt-6">
        <AdminChatBox orderId={order.id} customerName={order.customerName} />
      </div>
    </div>
  );
}
