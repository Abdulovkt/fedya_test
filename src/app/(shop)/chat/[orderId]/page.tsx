import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { ChatBox } from "@/components/shop/ChatBox";
import { findOrderIdentity, getDisplayOrderNumber } from "@/lib/order-number";

type Props = {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ token?: string }>;
};

export const metadata = { title: "Чат с магазином" };

export default async function CustomerChatPage({ params, searchParams }: Props) {
  const { orderId } = await params;
  const { token } = await searchParams;

  if (!token) notFound();
  const orderIdentity = await findOrderIdentity(orderId);
  if (!orderIdentity) notFound();
  const oid = orderIdentity.id;

  const [order] = await db
    .select({
      id: orders.id,
      publicOrderNumber: orders.publicOrderNumber,
      customerName: orders.customerName,
      chatToken: orders.chatToken,
      paymentMethod: orders.paymentMethod,
      paymentStatus: orders.paymentStatus,
    })
    .from(orders)
    .where(eq(orders.id, oid))
    .limit(1);

  if (!order || order.chatToken !== token) notFound();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:max-w-5xl lg:px-8 lg:py-10">
      <h1 className="text-2xl font-bold text-brand-heading sm:text-3xl">Чат с магазином</h1>
      <p className="mt-2 max-w-3xl text-base text-brand-muted">
        Здравствуйте, {order.customerName}! Задайте любой вопрос по вашему заказу.
      </p>
      <div className="mt-8">
        <ChatBox
          orderId={order.id}
          orderNumber={getDisplayOrderNumber(order)}
          token={token}
          suggestPaymentReceipt={
            order.paymentMethod === "bank_transfer" &&
            order.paymentStatus !== "paid" &&
            order.paymentStatus !== "failed"
          }
        />
      </div>
    </div>
  );
}
