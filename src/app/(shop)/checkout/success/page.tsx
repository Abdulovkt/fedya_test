import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { findOrderIdentity, getDisplayOrderNumber } from "@/lib/order-number";
import { syncOrderPaymentStatusById } from "@/lib/paypass-sync";

type Props = { searchParams: Promise<{ order?: string; token?: string }> };

export const metadata = { title: "Заказ оформлен" };

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { order, token } = await searchParams;
  const orderIdentity = order ? await findOrderIdentity(order) : null;
  const orderId = orderIdentity?.id;
  const canLoadOrder = Boolean(orderId && token);

  let orderRecord:
    | {
        id: number;
        publicOrderNumber: string | null;
        chatToken: string | null;
        paymentStatus: string;
        paymentFailureReason: string | null;
        paypassTelegramLink: string | null;
      }
    | undefined;

  if (canLoadOrder) {
    const resolvedOrderId = orderId as number;
    [orderRecord] = await db
      .select({
        id: orders.id,
        publicOrderNumber: orders.publicOrderNumber,
        chatToken: orders.chatToken,
        paymentStatus: orders.paymentStatus,
        paymentFailureReason: orders.paymentFailureReason,
        paypassTelegramLink: orders.paypassTelegramLink,
      })
      .from(orders)
      .where(eq(orders.id, resolvedOrderId))
      .limit(1);

    const isValidToken = Boolean(orderRecord && token && orderRecord.chatToken === token);
    if (
      isValidToken &&
      orderRecord &&
      (orderRecord.paymentStatus === "pending" || orderRecord.paymentStatus === "unpaid")
    ) {
      await syncOrderPaymentStatusById(resolvedOrderId);
      [orderRecord] = await db
        .select({
          id: orders.id,
          publicOrderNumber: orders.publicOrderNumber,
          chatToken: orders.chatToken,
          paymentStatus: orders.paymentStatus,
          paymentFailureReason: orders.paymentFailureReason,
          paypassTelegramLink: orders.paypassTelegramLink,
        })
        .from(orders)
        .where(eq(orders.id, resolvedOrderId))
        .limit(1);
    }
  }

  const isTokenValid = Boolean(orderRecord && token && orderRecord.chatToken === token);
  const paymentLink = isTokenValid && orderRecord ? orderRecord.paypassTelegramLink : null;
  const qrUrl = paymentLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(paymentLink)}`
    : null;

  const paymentMeta =
    orderRecord?.paymentStatus === "paid"
      ? { label: "Оплачен", tone: "bg-green-50 border-green-200 text-green-700" }
      : orderRecord?.paymentStatus === "failed"
        ? { label: "Оплата отклонена", tone: "bg-red-50 border-red-200 text-red-700" }
        : orderRecord?.paymentStatus === "pending"
          ? { label: "Ожидает оплату", tone: "bg-yellow-50 border-yellow-200 text-yellow-700" }
        : orderRecord?.paymentStatus === "unpaid"
          ? { label: "Ссылка оплаты готовится", tone: "bg-brand-elevated border-brand-border text-brand-muted" }
          : null;
  const displayOrderNumber =
    orderRecord ? getDisplayOrderNumber(orderRecord) : order ? `#${order}` : null;

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-green-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h1 className="mt-4 text-2xl font-bold text-brand-heading">
        Спасибо за заказ!
      </h1>
      {displayOrderNumber && (
        <p className="mt-3 text-brand-muted">
          Номер заказа:{" "}
          <span className="font-mono font-semibold text-brand">{displayOrderNumber}</span>
        </p>
      )}
      <p className="mt-2 text-sm text-brand-muted">
        Мы свяжемся с вами по указанным контактам.
      </p>

      {orderRecord && token && (
        <div className="mt-6 rounded-xl border border-brand-teal/30 bg-brand-teal/5 px-5 py-4">
          <p className="text-sm font-medium text-brand-heading">
            Есть вопросы по заказу?
          </p>
          <p className="mt-1 text-sm text-brand-muted">
            Напишите нам в чат — ответим быстро.
          </p>
          <Link
            href={`/chat/${orderRecord.publicOrderNumber ?? orderRecord.id}?token=${token}`}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand-teal px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-teal/80"
          >
            Открыть чат
          </Link>
        </div>
      )}

      {isTokenValid && paymentMeta && (
        <div className="mt-6 rounded-xl border border-brand-border bg-brand-surface px-5 py-4 text-left">
          <p className="text-sm font-medium text-brand-heading">Оплата</p>
          <p
            className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${paymentMeta.tone}`}
          >
            {paymentMeta.label}
          </p>

          {paymentLink ? (
            <>
              <p className="mt-3 text-sm text-brand-muted">
                Нажмите кнопку ниже или отсканируйте QR-код, чтобы открыть оплату в Telegram-боте.
              </p>
              <a
                href={paymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover"
              >
                Открыть оплату в Telegram
              </a>
              {qrUrl && (
                <div className="mt-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrUrl}
                    alt="QR код для открытия оплаты в Telegram"
                    className="mx-auto h-52 w-52 rounded-lg border border-brand-border bg-white p-2"
                    loading="lazy"
                  />
                </div>
              )}
            </>
          ) : (
            <p className="mt-3 text-sm text-brand-muted">
              Ссылка на оплату пока недоступна. Свяжитесь с менеджером через чат заказа.
            </p>
          )}

          {orderRecord?.paymentFailureReason && (
            <p className="mt-2 text-xs text-brand-muted/80">
              Причина: {orderRecord.paymentFailureReason}
            </p>
          )}
        </div>
      )}

      <Link
        href="/catalog"
        className="mt-6 inline-block rounded-xl bg-brand px-6 py-2 font-semibold text-white hover:bg-brand-hover"
      >
        Продолжить покупки
      </Link>
    </div>
  );
}
