"use client";

import { useActionState } from "react";
import {
  placeOrder,
  type CheckoutState,
} from "@/app/actions/checkout";

const initialState: CheckoutState = {};

export function CheckoutForm({
  promoCode,
  needsCdekPickup = false,
}: {
  promoCode?: string | null;
  /** Показать обязательное поле «ПВЗ СДЭК» */
  needsCdekPickup?: boolean;
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
        <label htmlFor="address" className="block text-sm text-brand-muted">
          Адрес доставки (необязательно)
        </label>
        <textarea
          id="address"
          name="address"
          rows={2}
          className="mt-1 w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-brand-heading"
        />
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
          <label htmlFor="cdekPickupPoint" className="block text-sm text-brand-muted">
            Пункт выдачи СДЭК
          </label>
          <p className="mt-0.5 text-xs text-brand-muted">
            Адрес ПВЗ, код офиса или краткий комментарий — как вам удобнее.
          </p>
          <textarea
            id="cdekPickupPoint"
            name="cdekPickupPoint"
            required
            rows={3}
            className="mt-1 w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-brand-heading"
            placeholder="Например: ул. …, СДЭК, код 1234"
          />
          {state.fieldErrors?.cdekPickupPoint?.[0] ? (
            <p className="mt-1 text-xs text-red-400">{state.fieldErrors.cdekPickupPoint[0]}</p>
          ) : null}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-brand-teal py-3 font-semibold text-white transition-colors duration-200 hover:bg-brand-teal/90 disabled:opacity-60"
      >
        {pending ? "Отправка…" : "Подтвердить заказ"}
      </button>
    </form>
  );
}
