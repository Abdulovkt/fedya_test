"use client";

import { useActionState, useState } from "react";
import { createPromoCode, type CreatePromoCodeState } from "@/app/actions/admin";

type ProductOption = {
  id: number;
  name: string;
};

const initialState: CreatePromoCodeState = null;

export function PromoCodeForm({ products }: { products: ProductOption[] }) {
  const [state, formAction, pending] = useActionState(createPromoCode, initialState);
  const [appliesToAll, setAppliesToAll] = useState(true);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-brand-border bg-brand-surface/40 p-5"
    >
      <h2 className="text-lg font-semibold text-brand-heading">Новый промокод</h2>

      {state?.error ? (
        <p className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="rounded-lg border border-emerald-900/50 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300">
          Промокод создан, письма покупателям отправляются.
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="code" className="text-xs text-brand-muted">
            Код
          </label>
          <input
            id="code"
            name="code"
            required
            className="mt-1 w-full rounded border border-brand-border bg-brand-surface px-3 py-2 text-sm uppercase text-brand-heading"
            placeholder="SPRING10"
          />
        </div>
        <div>
          <label htmlFor="discountPercent" className="text-xs text-brand-muted">
            Скидка, %
          </label>
          <input
            id="discountPercent"
            name="discountPercent"
            type="number"
            min={1}
            max={90}
            required
            className="mt-1 w-full rounded border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-heading"
          />
        </div>
        <div>
          <label htmlFor="startsAt" className="text-xs text-brand-muted">
            Дата начала
          </label>
          <input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            required
            className="mt-1 w-full rounded border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-heading"
          />
        </div>
        <div>
          <label htmlFor="endsAt" className="text-xs text-brand-muted">
            Дата окончания
          </label>
          <input
            id="endsAt"
            name="endsAt"
            type="datetime-local"
            required
            className="mt-1 w-full rounded border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-heading"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-brand-heading">
        <input
          type="checkbox"
          name="appliesToAll"
          checked={appliesToAll}
          onChange={(event) => setAppliesToAll(event.target.checked)}
        />
        Промокод действует на все товары
      </label>

      {!appliesToAll ? (
        <div>
          <p className="text-xs text-brand-muted">Выберите товары</p>
          <div className="mt-2 max-h-60 space-y-2 overflow-y-auto rounded-lg border border-brand-border bg-brand-surface p-3">
            {products.map((product) => (
              <label
                key={product.id}
                className="flex items-center gap-2 text-sm text-brand-heading"
              >
                <input type="checkbox" name="productIds" value={product.id} />
                {product.name}
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
      >
        {pending ? "Создание..." : "Создать промокод"}
      </button>
    </form>
  );
}
