import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";
import { formatPrice } from "@/lib/format";
import { getPricingFromStoredOrder } from "@/lib/pricing";
import { AdminSyncPaymentButton } from "@/components/admin/AdminSyncPaymentButton";
import { OrderStatusChanger } from "@/components/admin/OrderStatusChanger";
import { syncOrderPaymentStatusById } from "@/lib/paypass-sync";
import { getDisplayOrderNumber } from "@/lib/order-number";
import { getPaymentStatusMeta } from "@/lib/order-statuses";

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const oid = Number(id);
  if (!Number.isFinite(oid)) notFound();

  let [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, oid))
    .limit(1);
  if (!order) notFound();

  if (order.paymentStatus === "pending" || order.paymentStatus === "unpaid") {
    await syncOrderPaymentStatusById(oid);
    [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, oid))
      .limit(1);
    if (!order) notFound();
  }

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

  const pricing = getPricingFromStoredOrder({
    subtotal: order.subtotalAmount,
    autoDiscountAmount: order.autoDiscountAmount,
    promoCode: order.promoCode,
    promoDiscountAmount: order.promoDiscountAmount,
    promoDiscountPercent: order.promoDiscountPercent,
    totalAmount: order.totalAmount,
  });

  const paymentMeta = getPaymentStatusMeta(order.paymentStatus);
  const displayOrderNumber = getDisplayOrderNumber(order);

  return (
    <div>
      <Link
        href="/admin/orders"
        className="text-sm text-brand hover:underline"
      >
        ← Все заказы
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-brand-heading">
        Заказ {displayOrderNumber}
      </h1>
      <p className="mt-1 text-sm text-brand-muted">
        {order.createdAt instanceof Date
          ? order.createdAt.toLocaleString("ru-RU")
          : ""}
      </p>

      <div className="mt-6 rounded-xl border border-brand-border bg-brand-surface/40 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <OrderStatusChanger
            orderId={order.id}
            current={order.status}
            paymentStatus={order.paymentStatus}
          />
          <Link
            href={`/admin/chats/${order.id}`}
            className="rounded-lg border border-brand-border px-3 py-1.5 text-sm font-medium text-brand hover:border-brand/40 hover:bg-brand hover:text-white"
          >
            Открыть чат
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-brand-border p-5 sm:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-brand-muted">Оплата</h2>
              <p
                className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${paymentMeta.color}`}
              >
                {paymentMeta.label}
              </p>
              {order.paymentFailureReason ? (
                <p className="mt-2 text-xs text-brand-muted">
                  Причина: {order.paymentFailureReason}
                </p>
              ) : null}
              {order.paypassStatus ? (
                <p className="mt-1 text-xs text-brand-muted">
                  Статус PayPass: {order.paypassStatus}
                </p>
              ) : null}
              {order.paidAmount ? (
                <p className="mt-1 text-xs text-brand-muted">
                  Подтвержденная сумма: {formatPrice(order.paidAmount)}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {order.paypassTelegramLink ? (
                <a
                  href={order.paypassTelegramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-brand-border px-3 py-1.5 text-sm font-medium text-brand hover:border-brand/40 hover:bg-brand hover:text-white"
                >
                  Открыть ссылку оплаты
                </a>
              ) : null}
              <AdminSyncPaymentButton orderId={order.id} />
            </div>
          </div>
        </div>

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
            <p className="mt-2 min-w-0 break-words text-sm text-brand-heading">
              {order.address}
            </p>
          ) : null}
          {order.comment ? (
            <p className="mt-2 text-sm text-brand-muted">
              Комментарий: {order.comment}
            </p>
          ) : null}
        </div>
        <div className="rounded-xl border border-brand-border p-5">
          <h2 className="text-sm font-semibold text-brand-muted">Итого</h2>
          <div className="mt-2 space-y-2 text-sm">
            <p className="flex justify-between gap-4 text-brand-muted">
              <span>Сумма товаров</span>
              <span>{formatPrice(pricing.subtotal)}</span>
            </p>
            {pricing.autoDiscountAmount > 0 && (
              <p className="flex justify-between gap-4 font-medium text-brand">
                <span>Скидка по сумме {pricing.autoDiscountRate}%</span>
                <span>-{formatPrice(pricing.autoDiscountAmount)}</span>
              </p>
            )}
            {pricing.promoDiscountAmount > 0 && (
              <p className="flex justify-between gap-4 font-medium text-brand">
                <span>Промокод {pricing.appliedPromoCode} ({pricing.promoDiscountPercent}%)</span>
                <span>-{formatPrice(pricing.promoDiscountAmount)}</span>
              </p>
            )}
            <p className="flex justify-between gap-4 text-xl font-bold text-brand">
              <span>Итого</span>
              <span>{formatPrice(pricing.finalTotal)}</span>
            </p>
          </div>
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
                <td className="max-w-[12rem] px-4 py-2 break-words text-brand-heading sm:max-w-none">
                  {row.productName}
                </td>
                <td className="px-4 py-2">{row.quantity}</td>
                <td className="px-4 py-2">{formatPrice(row.priceAtOrder)}</td>
                <td className="px-4 py-2">
                  {formatPrice(row.priceAtOrder * row.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-brand-border">
              <td colSpan={3} className="px-4 py-2 text-brand-muted">
                Сумма товаров
              </td>
              <td className="px-4 py-2 text-brand-heading">
                {formatPrice(pricing.subtotal)}
              </td>
            </tr>
            {pricing.autoDiscountAmount > 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-2 text-brand-muted">
                  Скидка по сумме {pricing.autoDiscountRate}%
                </td>
                <td className="px-4 py-2 font-medium text-brand">
                  -{formatPrice(pricing.autoDiscountAmount)}
                </td>
              </tr>
            )}
            {pricing.promoDiscountAmount > 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-2 text-brand-muted">
                  Промокод {pricing.appliedPromoCode} ({pricing.promoDiscountPercent}%)
                </td>
                <td className="px-4 py-2 font-medium text-brand">
                  -{formatPrice(pricing.promoDiscountAmount)}
                </td>
              </tr>
            )}
            <tr>
              <td colSpan={3} className="px-4 py-2 text-brand-muted">
                Итого
              </td>
              <td className="px-4 py-2 font-bold text-brand">
                {formatPrice(pricing.finalTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
