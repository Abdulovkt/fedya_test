"use client";

import { useActionState } from "react";
import { placeOrder, type CheckoutState } from "@/app/actions/checkout";
import { CDEK_PVZ_TEXT_MIN_LENGTH, RUSSIAN_POST_ADDRESS_MIN_LEN } from "@/lib/shipping";

const initialState: CheckoutState = {};

export function CheckoutForm({
  promoCode,
  needsCdekPickup = false,
  hasRussianPost = false,
  paymentOptions,
  paymentsDisabled = false,
}: {
  promoCode?: string | null;
  /** Показать обязательное поле «ПВЗ СДЭК» */
  needsCdekPickup?: boolean;
  /** В корзине есть товары с отгрузкой Почтой России — адрес в формате одной строки, обязателен */
  hasRussianPost?: boolean;
  paymentOptions: {
    showPaypass: boolean;
    showBank: boolean;
    defaultMethod: "paypass" | "bank_transfer";
  };
  /** Ни один способ оплаты не настроен в админке */
  paymentsDisabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    placeOrder,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? (
        <p className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      ) : null}
      <div>
        <label htmlFor="customerName" className="block text-sm text-brand-muted">
          Имя и фамилия
        </label>
        <input
          id="customerName"
          name="customerName"
          required
          className="mt-1 w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-brand-heading"
        />
        {state.fieldErrors?.customerName?.[0] ? (
          <p className="mt-1 text-xs text-red-400">
            {state.fieldErrors.customerName[0]}
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm text-brand-muted">
          Телефон
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          className="mt-1 w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-brand-heading"
        />
        {state.fieldErrors?.phone?.[0] ? (
          <p className="mt-1 text-xs text-red-400">{state.fieldErrors.phone[0]}</p>
        ) : null}
      </div>
      <div>
        <label htmlFor="email" className="block text-sm text-brand-muted">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-brand-heading"
        />
        {state.fieldErrors?.email?.[0] ? (
          <p className="mt-1 text-xs text-red-400">{state.fieldErrors.email[0]}</p>
        ) : null}
        {promoCode ? (
          <p className="mt-1 text-xs text-brand-muted">
            Для промокода {promoCode} после ввода этого email будет выполнена финальная проверка:
            использовался ли он ранее этим покупателем по email или по совпадению ФИО и адреса.
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor="telegram" className="block text-sm text-brand-muted">
          Telegram (необязательно)
        </label>
        <input
          id="telegram"
          name="telegram"
          placeholder="@username"
          className="mt-1 w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-brand-heading"
        />
      </div>
      <div>
        {hasRussianPost ? (
          <>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-brand-heading"
            >
              Адрес доставки Почтой России
            </label>
            <p id="address-hint" className="mt-0.5 text-xs text-brand-muted">
              Укажите одной строкой, через пробел: <span className="text-brand-heading">индекс</span>,{" "}
              <span className="text-brand-heading">город</span>, <span className="text-brand-heading">улица</span>,{" "}
              <span className="text-brand-heading">дом</span> (корпус/кв. — при необходимости в конце строки).
            </p>
            <input
              id="address"
              name="address"
              type="text"
              required
              minLength={RUSSIAN_POST_ADDRESS_MIN_LEN}
              autoComplete="street-address"
              placeholder="630000 Новосибирск ул. Ленина д. 10"
              title="Как в примере: 6 цифр индекса, пробел, город, ул. …, д. …"
              aria-describedby="address-hint"
              className="mt-1 w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-brand-heading"
            />
            {state.fieldErrors?.address?.[0] ? (
              <p className="mt-1 text-xs text-red-400">{state.fieldErrors.address[0]}</p>
            ) : null}
          </>
        ) : (
          <>
            <label htmlFor="address" className="block text-sm text-brand-muted">
              Адрес доставки (необязательно)
            </label>
            <textarea
              id="address"
              name="address"
              rows={2}
              className="mt-1 w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-brand-heading"
            />
            {state.fieldErrors?.address?.[0] ? (
              <p className="mt-1 text-xs text-red-400">{state.fieldErrors.address[0]}</p>
            ) : null}
          </>
        )}
      </div>
      <div>
        <label htmlFor="comment" className="block text-sm text-brand-muted">
          Комментарий к заказу
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={2}
          className="mt-1 w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-brand-heading"
        />
      </div>
      {needsCdekPickup ? (
        <div>
          <label htmlFor="cdekPickupPoint" className="block text-sm font-medium text-brand-heading">
            Точный адрес пункта выдачи СДЭК (ПВЗ)
          </label>
          <p id="cdekPickupPoint-hint" className="mt-0.5 text-xs text-brand-muted">
            Скопируйте из карточки ПВЗ на{" "}
            <a
              href="https://www.cdek.ru/ru/offices"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand underline decoration-brand/30 underline-offset-2 hover:decoration-brand"
            >
              cdek.ru
            </a>{" "}
            полный адрес: город, улица, дом, корпус (и при необходимости — код офиса). Одной строки с
            «код 1234» без адреса недостаточно.
          </p>
          <textarea
            id="cdekPickupPoint"
            name="cdekPickupPoint"
            required
            minLength={CDEK_PVZ_TEXT_MIN_LENGTH}
            rows={4}
            aria-describedby="cdekPickupPoint-hint"
            className="mt-1 w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-brand-heading"
            placeholder="Новосибирск, ул. Ленина, д. 12, к. 2, ПВЗ СДЭК, код NSK12"
            autoComplete="off"
            title="Как в примере: город, ул., д., при необходимости корп./кв., ПВЗ, код"
          />
          {state.fieldErrors?.cdekPickupPoint?.[0] ? (
            <p className="mt-1 text-xs text-red-400">{state.fieldErrors.cdekPickupPoint[0]}</p>
          ) : null}
        </div>
      ) : null}
      {paymentOptions.showPaypass && paymentOptions.showBank ? (
        <fieldset className="space-y-2 rounded-xl border border-brand-border bg-brand-surface/40 p-4">
          <legend className="px-1 text-sm font-medium text-brand-heading">Способ оплаты</legend>
          <p className="text-xs text-brand-muted">
            Онлайн — ссылка на оплату в Telegram. Перевод — реквизиты карты на следующей странице,
            подтверждение вручную после поступления средств.
          </p>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent px-2 py-2 transition-colors duration-200 has-[:checked]:border-brand-teal/50 has-[:checked]:bg-brand-teal/5 hover:bg-brand-elevated/60">
            <input
              type="radio"
              name="paymentMethod"
              value="paypass"
              defaultChecked={paymentOptions.defaultMethod === "paypass"}
              className="mt-1 h-4 w-4 border-brand-border text-brand-teal focus:ring-brand-teal/40"
            />
            <span>
              <span className="block text-sm font-medium text-brand-heading">Онлайн (Telegram)</span>
              <span className="mt-0.5 block text-xs text-brand-muted">PayPass, оплата через бота</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent px-2 py-2 transition-colors duration-200 has-[:checked]:border-brand-teal/50 has-[:checked]:bg-brand-teal/5 hover:bg-brand-elevated/60">
            <input
              type="radio"
              name="paymentMethod"
              value="bank_transfer"
              defaultChecked={paymentOptions.defaultMethod === "bank_transfer"}
              className="mt-1 h-4 w-4 border-brand-border text-brand-teal focus:ring-brand-teal/40"
            />
            <span>
              <span className="block text-sm font-medium text-brand-heading">Перевод на карту</span>
              <span className="mt-0.5 block text-xs text-brand-muted">
                Реквизиты и сумма — после оформления; чек можно отправить в чат заказа
              </span>
            </span>
          </label>
        </fieldset>
      ) : paymentOptions.showBank ? (
        <input type="hidden" name="paymentMethod" value="bank_transfer" />
      ) : (
        <input type="hidden" name="paymentMethod" value="paypass" />
      )}
      <button
        type="submit"
        disabled={pending || paymentsDisabled}
        title={
          paymentsDisabled
            ? "Настройте способы оплаты в админке"
            : undefined
        }
        className="w-full rounded-xl bg-brand-teal py-3 font-semibold text-white transition-colors duration-200 hover:bg-brand-teal/90 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? "Отправка…" : "Подтвердить заказ"}
      </button>
    </form>
  );
}
