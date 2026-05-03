import Link from "next/link";
import { eq } from "drizzle-orm";
import { CheckoutSuccessPaymentPoller } from "@/components/shop/CheckoutSuccessPaymentPoller";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { findOrderIdentity, getDisplayOrderNumber } from "@/lib/order-number";
import { syncOrderPaymentStatusById } from "@/lib/paypass-sync";
import { getSettings, isBankTransferConfigured } from "@/lib/settings";
import { formatPrice } from "@/lib/format";

type Props = { searchParams: Promise<{ order?: string; token?: string }> };

export const metadata = { title: "Заказ оформлен" };

type OrderRecord = {
  id: number;
  publicOrderNumber: string | null;
  chatToken: string | null;
  paymentStatus: string;
  paymentMethod: string;
  paymentFailureReason: string | null;
  paypassTelegramLink: string | null;
  totalAmount: number;
};

const orderSelect = {
  id: orders.id,
  publicOrderNumber: orders.publicOrderNumber,
  chatToken: orders.chatToken,
  paymentStatus: orders.paymentStatus,
  paymentMethod: orders.paymentMethod,
  paymentFailureReason: orders.paymentFailureReason,
  paypassTelegramLink: orders.paypassTelegramLink,
  totalAmount: orders.totalAmount,
} as const;

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { order, token } = await searchParams;
  const orderIdentity = order ? await findOrderIdentity(order) : null;
  const orderId = orderIdentity?.id;
  const canLoadOrder = Boolean(orderId && token);

  let orderRecord: OrderRecord | undefined;

  if (canLoadOrder) {
    const resolvedOrderId = orderId as number;
    [orderRecord] = await db
      .select(orderSelect)
      .from(orders)
      .where(eq(orders.id, resolvedOrderId))
      .limit(1);

    const isValidToken = Boolean(orderRecord && token && orderRecord.chatToken === token);
    if (
      isValidToken &&
      orderRecord &&
      orderRecord.paymentMethod === "paypass" &&
      (orderRecord.paymentStatus === "pending" || orderRecord.paymentStatus === "unpaid")
    ) {
      await syncOrderPaymentStatusById(resolvedOrderId);
      [orderRecord] = await db
        .select(orderSelect)
        .from(orders)
        .where(eq(orders.id, resolvedOrderId))
        .limit(1);
    }
  }

  const isTokenValid = Boolean(orderRecord && token && orderRecord.chatToken === token);
  const settings = isTokenValid ? await getSettings() : null;
  const paymentStatus = orderRecord?.paymentStatus;
  const paymentLink = isTokenValid && orderRecord ? orderRecord.paypassTelegramLink : null;
  const qrUrl = paymentLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(paymentLink)}`
    : null;
  const showTelegramPaymentCta =
    orderRecord?.paymentMethod !== "bank_transfer" &&
    Boolean(paymentLink) &&
    (paymentStatus === "pending" || paymentStatus === "unpaid");

  const paymentMeta =
    orderRecord?.paymentStatus === "paid"
      ? { label: "Оплачен", tone: "bg-green-50 border-green-200 text-green-700" }
      : orderRecord?.paymentStatus === "failed"
        ? { label: "Оплата отклонена", tone: "bg-red-50 border-red-200 text-red-700" }
        : orderRecord?.paymentStatus === "pending"
          ? { label: "Ожидает оплату", tone: "bg-yellow-50 border-yellow-200 text-yellow-700" }
          : orderRecord?.paymentStatus === "unpaid"
            ? {
                label:
                  orderRecord.paymentMethod === "bank_transfer"
                    ? "Ожидает оплату"
                    : "Ссылка оплаты готовится",
                tone: "bg-brand-elevated border-brand-border text-brand-muted",
              }
            : null;
  const displayOrderNumber =
    orderRecord ? getDisplayOrderNumber(orderRecord) : order ? `#${order}` : null;

  const chatHref =
    orderRecord && token
      ? `/chat/${orderRecord.publicOrderNumber ?? orderRecord.id}?token=${token}`
      : null;

  const showBankRequisites =
    Boolean(
      settings &&
        orderRecord?.paymentMethod === "bank_transfer" &&
        isBankTransferConfigured(settings),
    );

  /** PayPass не выдал ссылку — показываем перевод на карту, если реквизиты заданы в админке. */
  const showPaypassFallbackBank =
    Boolean(
      orderRecord?.paymentMethod === "paypass" &&
        !paymentLink &&
        settings &&
        isBankTransferConfigured(settings) &&
        (paymentStatus === "unpaid" || orderRecord?.paymentFailureReason === "paypass_create_error"),
    );

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
      <h1 className="mt-4 text-2xl font-bold text-brand-heading">Спасибо за заказ!</h1>
      {displayOrderNumber && (
        <p className="mt-3 text-brand-muted">
          Номер заказа:{" "}
          <span className="font-mono font-semibold text-brand">{displayOrderNumber}</span>
        </p>
      )}
      <p className="mt-2 text-sm text-brand-muted">
        Мы свяжемся с вами по указанным контактам.
      </p>

      {orderRecord && token && chatHref && (
        <div className="mt-6 rounded-xl border border-brand-teal/30 bg-brand-teal/5 px-5 py-4">
          <p className="text-sm font-medium text-brand-heading">Есть вопросы по заказу?</p>
          <p className="mt-1 text-sm text-brand-muted">
            Напишите нам в чат — ответим быстро. Оплатили переводом? В чате{" "}
            <strong className="font-semibold text-brand-heading">укажите номер заказа в тексте сообщения</strong>{" "}
            и <strong className="font-semibold text-brand-heading">обязательно приложите чек</strong>{" "}
            о переводе (скрин или файл) — кнопка со скрепкой. В банке ничего не пишите в назначении
            платежа и в комментарии к переводу: нужен перевод без этих полей.
          </p>
          <Link
            href={chatHref}
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

          {paymentStatus === "paid" && (
            <p className="mt-3 text-sm text-green-800">Оплата получена. Спасибо!</p>
          )}

          {paymentStatus === "failed" && (
            <p className="mt-3 text-sm text-brand-muted">
              Онлайн-оплата не прошла. Напишите в чат заказа — подскажем, как оплатить другим
              способом.
            </p>
          )}

          {(paymentStatus === "pending" || paymentStatus === "unpaid") && (
            <>
              {orderRecord?.paymentMethod === "bank_transfer" ? (
                <div className="mt-3 space-y-3 text-sm text-brand-heading">
                  <p className="text-brand-muted">
                    Переведите сумму заказа на карту. В банковском приложении не заполняйте «Назначение
                    платежа» и комментарий к переводу.
                  </p>
                  <p className="rounded-lg border border-brand-border bg-brand-elevated/50 px-3 py-2">
                    <span className="text-brand-muted">Сумма к переводу:</span>{" "}
                    <span className="text-lg font-bold tabular-nums text-brand">
                      {formatPrice(orderRecord.totalAmount)}
                    </span>
                  </p>
                  {showBankRequisites && settings ? (
                    <dl className="space-y-2 rounded-lg border border-brand-border bg-brand-elevated/30 px-3 py-3">
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-brand-muted">
                          Получатель
                        </dt>
                        <dd className="mt-0.5 font-medium">{settings.bank_transfer_recipient_name}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-brand-muted">
                          Номер карты
                        </dt>
                        <dd className="mt-0.5 font-mono text-base tracking-wide break-all">
                          {settings.bank_transfer_card_number}
                        </dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="text-brand-muted">
                      Реквизиты сейчас не отображаются — уточните их в чате с магазином.
                    </p>
                  )}
                  {chatHref ? (
                    <p className="text-brand-muted">
                      После перевода откройте{" "}
                      <Link href={chatHref} className="font-medium text-brand-teal underline">
                        чат заказа
                      </Link>
                      : в сообщении напишите номер заказа и{" "}
                      <strong className="font-semibold text-brand-heading">обязательно</strong> приложите
                      чек о переводе (скрин или PDF из банка) — кнопка со скрепкой.
                    </p>
                  ) : null}
                </div>
              ) : showPaypassFallbackBank && settings && orderRecord ? (
                <div className="mt-3 space-y-3 text-sm text-brand-heading">
                  <p className="rounded-lg border border-amber-400/50 bg-amber-50/90 px-3 py-2 text-amber-950">
                    Не удалось создать ссылку на оплату в Telegram (сервис временно недоступен или
                    проверьте ключ PayPass в админке). Оплатите заказ{" "}
                    <strong className="font-semibold">переводом на карту</strong> — реквизиты ниже. В
                    банке не указывайте текст в назначении платежа и в комментарии. Номер заказа и чек о
                    переводе отправьте в чат заказа.
                  </p>
                  <p className="rounded-lg border border-brand-border bg-brand-elevated/50 px-3 py-2">
                    <span className="text-brand-muted">Сумма к переводу:</span>{" "}
                    <span className="text-lg font-bold tabular-nums text-brand">
                      {formatPrice(orderRecord.totalAmount)}
                    </span>
                  </p>
                  <dl className="space-y-2 rounded-lg border border-brand-border bg-brand-elevated/30 px-3 py-3">
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-brand-muted">
                        Получатель
                      </dt>
                      <dd className="mt-0.5 font-medium">{settings.bank_transfer_recipient_name}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-brand-muted">
                        Номер карты
                      </dt>
                      <dd className="mt-0.5 font-mono text-base tracking-wide break-all">
                        {settings.bank_transfer_card_number}
                      </dd>
                    </div>
                  </dl>
                  {chatHref ? (
                    <p className="text-brand-muted">
                      <Link href={chatHref} className="font-medium text-brand-teal underline">
                        Чат заказа
                      </Link>
                      : в тексте сообщения укажите номер заказа и обязательно приложите чек о переводе
                      (скрин или PDF) — кнопка со скрепкой.
                    </p>
                  ) : null}
                </div>
              ) : showTelegramPaymentCta && paymentLink ? (
                <>
                  <p className="mt-3 text-sm text-brand-muted">
                    Нажмите кнопку ниже или отсканируйте QR-код, чтобы открыть оплату в
                    Telegram-боте.
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
                  {orderRecord?.paymentFailureReason === "paypass_create_error" ? (
                    <>
                      Ссылка на онлайн-оплату не создалась. Напишите в{" "}
                      {chatHref ? (
                        <Link href={chatHref} className="font-medium text-brand-teal underline">
                          чат заказа
                        </Link>
                      ) : (
                        "чат заказа"
                      )}
                      — пришлём реквизиты для оплаты или поможем завершить оплату.
                    </>
                  ) : (
                    <>Ссылка на оплату пока недоступна. Свяжитесь с менеджером через чат заказа.</>
                  )}
                </p>
              )}
            </>
          )}

          {orderRecord?.paymentFailureReason &&
            paymentStatus !== "paid" &&
            !(showPaypassFallbackBank && orderRecord.paymentFailureReason === "paypass_create_error") && (
            <p className="mt-2 text-xs text-brand-muted/80">
              Причина: {orderRecord.paymentFailureReason}
            </p>
          )}
        </div>
      )}

      {isTokenValid &&
        orderRecord &&
        order &&
        token &&
        orderRecord.paymentMethod === "paypass" &&
        (orderRecord.paymentStatus === "pending" || orderRecord.paymentStatus === "unpaid") && (
          <CheckoutSuccessPaymentPoller orderRef={order} token={token} />
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
