"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import { formatPrice } from "@/lib/format";
import { getPricingFromStoredOrder } from "@/lib/pricing";
import { getPaymentStatusMeta, getStatusMeta } from "@/lib/order-statuses";
import { AdminSyncPaymentButton } from "@/components/admin/AdminSyncPaymentButton";
import { OrderStatusChanger } from "@/components/admin/OrderStatusChanger";

type OrderItem = {
  productName: string;
  quantity: number;
  priceAtOrder: number;
};

type Order = {
  id: number;
  publicOrderNumber: string | null;
  createdAt: Date | null;
  status: string;
  paymentStatus: string;
  paymentFailureReason: string | null;
  paypassStatus: string | null;
  paypassLastCheckedAt: Date | null;
  customerName: string;
  phone: string;
  email: string;
  telegram: string | null;
  address: string | null;
  comment: string | null;
  subtotalAmount: number;
  autoDiscountAmount: number;
  promoCode: string | null;
  promoDiscountAmount: number;
  promoDiscountPercent: number;
  totalAmount: number;
  items: OrderItem[];
};

export function OrdersTable({ orders }: { orders: Order[] }) {
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <div className="overflow-x-auto rounded-xl border border-brand-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-brand-surface/80 text-brand-muted">
          <tr>
            <th className="w-8 px-4 py-3" />
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Дата</th>
            <th className="px-4 py-3">Клиент</th>
            <th className="px-4 py-3">Сумма</th>
            <th className="px-4 py-3">Оплата</th>
            <th className="px-4 py-3" title="Статус обработки заказа">
              Статус
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const isOpen = openId === o.id;
            const meta = getStatusMeta(o.status);
            const payMeta = getPaymentStatusMeta(o.paymentStatus);
            const displayOrderNumber = o.publicOrderNumber ?? `#${o.id}`;
            const paypassChecked =
              o.paypassLastCheckedAt instanceof Date
                ? o.paypassLastCheckedAt.toLocaleString("ru-RU")
                : o.paypassLastCheckedAt
                  ? new Date(o.paypassLastCheckedAt).toLocaleString("ru-RU")
                  : null;
            const pricing = getPricingFromStoredOrder({
              subtotal: o.subtotalAmount,
              autoDiscountAmount: o.autoDiscountAmount,
              promoCode: o.promoCode,
              promoDiscountAmount: o.promoDiscountAmount,
              promoDiscountPercent: o.promoDiscountPercent,
              totalAmount: o.totalAmount,
            });
            return (
              <Fragment key={o.id}>
                <tr
                  onClick={() => setOpenId(isOpen ? null : o.id)}
                  className="cursor-pointer border-t border-brand-border transition hover:bg-brand-elevated"
                >
                  <td className="px-4 py-3 text-brand-muted">
                    <span
                      className={`inline-block transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                    >
                      ▶
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold text-brand">
                    {displayOrderNumber}
                  </td>
                  <td className="px-4 py-3 text-brand-muted">
                    {o.createdAt
                      ? new Date(o.createdAt).toLocaleString("ru-RU")
                      : ""}
                  </td>
                  <td className="px-4 py-3 text-brand-heading">
                    {o.customerName}
                  </td>
                  <td className="px-4 py-3 font-medium text-brand-heading">
                    {formatPrice(o.totalAmount)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex w-fit rounded-full border px-2.5 py-0.5 text-xs font-medium ${payMeta.color}`}
                    >
                      {payMeta.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.color}`}
                    >
                      {meta.label}
                    </span>
                  </td>
                </tr>

                {isOpen && (
                  <tr className="border-t border-brand-border bg-brand-elevated">
                    <td colSpan={7} className="px-6 py-5">
                      <div className="mb-4 rounded-lg border border-brand-border bg-brand-surface/60 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
                          Оплата
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${payMeta.color}`}
                          >
                            {payMeta.label}
                          </span>
                          {o.paypassStatus ? (
                            <span className="text-xs text-brand-muted">
                              PayPass: {o.paypassStatus}
                            </span>
                          ) : null}
                        </div>
                        {o.paymentFailureReason && o.paymentStatus !== "paid" ? (
                          <p className="mt-2 text-xs text-brand-muted">
                            Причина: {o.paymentFailureReason}
                          </p>
                        ) : null}
                        {paypassChecked ? (
                          <p className="mt-1 text-xs text-brand-muted">
                            Синхронизация с PayPass: {paypassChecked}
                          </p>
                        ) : null}
                      </div>
                      <div
                        className="mb-6 flex flex-wrap items-start justify-between gap-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <OrderStatusChanger
                          orderId={o.id}
                          current={o.status}
                          paymentStatus={o.paymentStatus}
                        />
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
                          <Link
                            href={`/admin/chats/${o.id}`}
                            className="rounded-lg border border-brand-border bg-brand-surface px-3 py-1.5 text-center text-sm font-medium text-brand hover:border-brand/40 hover:bg-brand hover:text-white sm:min-w-[12.5rem]"
                          >
                            Открыть чат
                          </Link>
                          <AdminSyncPaymentButton
                            orderId={o.id}
                            className="w-full sm:min-w-[12.5rem]"
                          />
                        </div>
                      </div>
                      <div className="grid gap-6 sm:grid-cols-2">
                        {/* Customer info */}
                        <div>
                          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-muted">
                            Данные клиента
                          </p>
                          <dl className="space-y-1.5 text-sm">
                            <div className="flex gap-2">
                              <dt className="w-24 shrink-0 text-brand-muted">Имя</dt>
                              <dd className="text-brand-heading">{o.customerName}</dd>
                            </div>
                            <div className="flex gap-2">
                              <dt className="w-24 shrink-0 text-brand-muted">Телефон</dt>
                              <dd>
                                <a href={`tel:${o.phone}`} className="text-brand hover:underline">
                                  {o.phone}
                                </a>
                              </dd>
                            </div>
                            <div className="flex gap-2">
                              <dt className="w-24 shrink-0 text-brand-muted">Email</dt>
                              <dd>
                                <a href={`mailto:${o.email}`} className="text-brand hover:underline">
                                  {o.email}
                                </a>
                              </dd>
                            </div>
                            {o.telegram && (
                              <div className="flex gap-2">
                                <dt className="w-24 shrink-0 text-brand-muted">Telegram</dt>
                                <dd>
                                  <a
                                    href={`https://t.me/${o.telegram.replace(/^@/, "")}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-brand-teal hover:underline"
                                  >
                                    {o.telegram.startsWith("@") ? o.telegram : `@${o.telegram}`}
                                  </a>
                                </dd>
                              </div>
                            )}
                            {o.address && (
                              <div className="flex gap-2">
                                <dt className="w-24 shrink-0 text-brand-muted">Адрес</dt>
                                <dd className="text-brand-heading">{o.address}</dd>
                              </div>
                            )}
                            {o.comment && (
                              <div className="flex gap-2">
                                <dt className="w-24 shrink-0 text-brand-muted">Комментарий</dt>
                                <dd className="text-brand-heading">{o.comment}</dd>
                              </div>
                            )}
                          </dl>
                        </div>

                        {/* Order items */}
                        <div>
                          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-muted">
                            Состав заказа
                          </p>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-xs text-brand-muted">
                                <th className="pb-1.5 font-medium">Товар</th>
                                <th className="pb-1.5 font-medium">Кол-во</th>
                                <th className="pb-1.5 font-medium">Сумма</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border">
                              {o.items.map((item, i) => (
                                <tr key={i}>
                                  <td className="py-1.5 text-brand-heading">
                                    {item.productName}
                                  </td>
                                  <td className="py-1.5 text-brand-muted">
                                    {item.quantity} шт.
                                  </td>
                                  <td className="py-1.5 font-medium text-brand-heading">
                                    {formatPrice(item.priceAtOrder * item.quantity)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t border-brand-border">
                                <td colSpan={2} className="pt-2 text-brand-muted">
                                  Сумма товаров
                                </td>
                                <td className="pt-2 text-brand-heading">
                                  {formatPrice(pricing.subtotal)}
                                </td>
                              </tr>
                              {pricing.autoDiscountAmount > 0 && (
                                <tr>
                                  <td colSpan={2} className="pt-2 text-brand-muted">
                                    Скидка по сумме {pricing.autoDiscountRate}%
                                  </td>
                                  <td className="pt-2 font-medium text-brand">
                                    -{formatPrice(pricing.autoDiscountAmount)}
                                  </td>
                                </tr>
                              )}
                              {pricing.promoDiscountAmount > 0 && (
                                <tr>
                                  <td colSpan={2} className="pt-2 text-brand-muted">
                                    Промокод {pricing.appliedPromoCode} ({pricing.promoDiscountPercent}%)
                                  </td>
                                  <td className="pt-2 font-medium text-brand">
                                    -{formatPrice(pricing.promoDiscountAmount)}
                                  </td>
                                </tr>
                              )}
                              <tr>
                                <td colSpan={2} className="pt-2 text-brand-muted">
                                  Итого
                                </td>
                                <td className="pt-2 font-bold text-brand">
                                  {formatPrice(pricing.finalTotal)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
