"use client";

import { Fragment, useState } from "react";
import { formatPrice } from "@/lib/format";
import { getStatusMeta } from "@/lib/order-statuses";
import { OrderStatusChanger } from "@/components/admin/OrderStatusChanger";

type OrderItem = {
  productName: string;
  quantity: number;
  priceAtOrder: number;
};

type Order = {
  id: number;
  createdAt: Date | null;
  status: string;
  customerName: string;
  phone: string;
  email: string;
  telegram: string | null;
  address: string | null;
  comment: string | null;
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
            <th className="px-4 py-3">Статус</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const isOpen = openId === o.id;
            const meta = getStatusMeta(o.status);
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
                    {o.id}
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
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.color}`}
                    >
                      {meta.label}
                    </span>
                  </td>
                </tr>

                {isOpen && (
                  <tr className="border-t border-brand-border bg-brand-elevated">
                    <td colSpan={6} className="px-6 py-5">
                      <div className="mb-6">
                        <OrderStatusChanger orderId={o.id} current={o.status} />
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
                                  Итого
                                </td>
                                <td className="pt-2 font-bold text-brand">
                                  {formatPrice(o.totalAmount)}
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
