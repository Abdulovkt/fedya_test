import Link from "next/link";
import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { AutoRefresh } from "@/components/admin/AutoRefresh";

export const metadata = { title: "Чаты с клиентами" };

export default async function AdminChatsPage() {
  const list = await db
    .select({
      orderId: orders.id,
      customerName: orders.customerName,
      phone: orders.phone,
      createdAt: orders.createdAt,
      lastMessage: sql<string>`(
        SELECT text FROM chat_messages
        WHERE order_id = ${orders.id}
        ORDER BY created_at DESC LIMIT 1
      )`,
      lastAt: sql<number>`(
        SELECT created_at FROM chat_messages
        WHERE order_id = ${orders.id}
        ORDER BY created_at DESC LIMIT 1
      )`,
    })
    .from(orders)
    .orderBy(desc(orders.createdAt));

  // Unread = customer messages after admin last read the chat
  const unreadRows = await db.all(sql`
    SELECT cm.order_id, COUNT(*) as unread
    FROM chat_messages cm
    JOIN orders o ON o.id = cm.order_id
    WHERE cm.sender = 'customer'
      AND cm.created_at > COALESCE(o.admin_last_read_at, 0)
    GROUP BY cm.order_id
  `);

  const unreadMap = new Map<number, number>(
    (unreadRows as { order_id: number; unread: number }[]).map((r) => [
      Number(r.order_id),
      Number(r.unread),
    ]),
  );

  const enriched = list.map((o) => ({
    ...o,
    unreadCount: unreadMap.get(o.orderId) ?? 0,
  }));

  const withMessages = enriched.filter((o) => o.lastMessage);
  const withoutMessages = enriched.filter((o) => !o.lastMessage);
  const sorted = [
    ...withMessages.sort((a, b) => (b.lastAt ?? 0) - (a.lastAt ?? 0)),
    ...withoutMessages,
  ];

  return (
    <div>
      <AutoRefresh />
      <h1 className="text-2xl font-bold text-brand-heading">Чаты с клиентами</h1>
      <p className="mt-1 text-sm text-brand-muted">
        Всего заказов: {list.length} · С сообщениями: {withMessages.length}
        {enriched.some((o) => o.unreadCount > 0) && (
          <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-white">
            {enriched.reduce((s, o) => s + o.unreadCount, 0)} новых
          </span>
        )}
      </p>

      <div className="mt-6 divide-y divide-brand-border overflow-hidden rounded-xl border border-brand-border">
        {sorted.length === 0 && (
          <p className="px-4 py-6 text-brand-muted">Заказов пока нет.</p>
        )}
        {sorted.map((o) => (
          <Link
            key={o.orderId}
            href={`/admin/chats/${o.orderId}`}
            className="flex items-center gap-4 px-5 py-4 transition hover:bg-brand-elevated"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
              #{o.orderId}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-brand-heading">{o.customerName}</p>
              <p className="text-sm text-brand-muted">
                {o.lastMessage
                  ? <span className="truncate">{o.lastMessage}</span>
                  : <span className="italic">Нет сообщений</span>}
              </p>
            </div>
            <div className="shrink-0 text-right">
              {o.lastAt ? (
                <p className="text-xs text-brand-muted">
                  {new Date(o.lastAt).toLocaleString("ru-RU", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              ) : null}
              {o.unreadCount > 0 && (
                <span className="mt-1 inline-block rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-white">
                  {o.unreadCount}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
