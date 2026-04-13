"use client";

import { useActionState } from "react";
import {
  placeOrder,
  type CheckoutState,
} from "@/app/actions/checkout";

const initialState: CheckoutState = {};

export function CheckoutForm() {
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
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-brand py-3 font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
      >
        {pending ? "Отправка…" : "Подтвердить заказ"}
      </button>
    </form>
  );
}
