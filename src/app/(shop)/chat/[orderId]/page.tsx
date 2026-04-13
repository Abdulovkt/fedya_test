import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { ChatBox } from "@/components/shop/ChatBox";

type Props = {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ token?: string }>;
};

export const metadata = { title: "Чат с магазином" };

export default async function CustomerChatPage({ params, searchParams }: Props) {
  const { orderId } = await params;
  const { token } = await searchParams;

  const oid = Number(orderId);
  if (!Number.isFinite(oid) || !token) notFound();

  const [order] = await db
    .select({ id: orders.id, customerName: orders.customerName, chatToken: orders.chatToken })
    .from(orders)
    .where(eq(orders.id, oid))
    .limit(1);

  if (!order || order.chatToken !== token) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-brand-heading">Чат с магазином</h1>
      <p className="mt-1 text-sm text-brand-muted">
        Здравствуйте, {order.customerName}! Задайте любой вопрос по вашему заказу.
      </p>
      <div className="mt-6">
        <ChatBox orderId={order.id} token={token} />
      </div>
    </div>
  );
}
