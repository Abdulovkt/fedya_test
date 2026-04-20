"use client";

import { useActionState } from "react";
import { applyPromoCode, removePromoCode, type PromoCodeState } from "@/app/actions/cart";
import { formatPrice } from "@/lib/format";

const initialState: PromoCodeState = null;

type PromoCodeFormProps = {
  appliedPromoCode: string | null;
  promoDiscountPercent: number;
  promoDiscountAmount: number;
  availableAutoDiscountAmount: number;
  autoDiscountRate: number;
  promoError?: string | null;
};

export function PromoCodeForm({
  appliedPromoCode,
  promoDiscountPercent,
  promoDiscountAmount,
  availableAutoDiscountAmount,
  autoDiscountRate,
  promoError = null,
}: PromoCodeFormProps) {
  const [state, formAction, pending] = useActionState(applyPromoCode, initialState);

  return (
    <div className="rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-brand-heading">Промокод</h2>
      <p className="mt-2 text-sm text-brand-muted">
        Если вы активируете промокод, автоматическая скидка по сумме заказа применяться не будет.
      </p>
      <p className="mt-1 text-sm text-brand-muted">
        В корзине мы показываем предварительный расчёт. Окончательная проверка промокода по email
        выполняется при оформлении заказа.
      </p>

      {appliedPromoCode ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-brand-teal/30 bg-brand-teal/10 p-4">
            <p className="text-sm font-medium text-brand-heading">
              Активирован промокод <span className="text-brand">{appliedPromoCode}</span>
            </p>
            <p className="mt-1 text-sm text-brand-muted">
              Предварительная скидка по промокоду {promoDiscountPercent}%: -{formatPrice(promoDiscountAmount)}
            </p>
            <p className="mt-1 text-sm text-brand-muted">
              После ввода email на этапе оформления заказа мы подтвердим, что этот промокод ещё
              доступен для данного покупателя.
            </p>
            {promoError ? (
              <p className="mt-1 text-sm text-red-300">{promoError}</p>
            ) : null}
            {availableAutoDiscountAmount > 0 && (
              <p className="mt-1 text-sm text-brand-muted">
                Обычная скидка {autoDiscountRate}% сейчас отключена. Чтобы вернуться к ней, удалите промокод.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <form action={removePromoCode}>
              <button
                type="submit"
                className="rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-brand-heading hover:bg-brand-elevated"
              >
                Убрать промокод
              </button>
            </form>
            <div className="min-w-0 flex-1 rounded-xl border border-brand-border bg-brand-surface/60 p-3">
              <p className="text-sm text-brand-muted">
                Можно сразу заменить текущий промокод на другой.
              </p>
              <form action={formAction} className="mt-3 space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    name="promoCode"
                    placeholder="Введите другой промокод"
                    className="w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm uppercase text-brand-heading"
                  />
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
                  >
                    {pending ? "Проверка..." : "Заменить"}
                  </button>
                </div>
                {state?.error ? (
                  <p className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
                    {state.error}
                  </p>
                ) : null}
                {state?.message ? (
                  <p className="rounded-lg border border-emerald-900/50 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300">
                    {state.message}. Итоговая проверка по email будет выполнена при оформлении заказа.
                  </p>
                ) : null}
              </form>
            </div>
          </div>
        </div>
      ) : (
        <form action={formAction} className="mt-4 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              name="promoCode"
              placeholder="Введите промокод"
              className="w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm uppercase text-brand-heading"
            />
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
            >
              {pending ? "Проверка..." : "Активировать"}
            </button>
          </div>
          {state?.error ? (
            <p className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
              {state.error}
            </p>
          ) : null}
          {state?.message ? (
            <p className="rounded-lg border border-emerald-900/50 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300">
              {state.message}. Итоговая проверка по email будет выполнена при оформлении заказа.
            </p>
          ) : null}
        </form>
      )}
    </div>
  );
}
