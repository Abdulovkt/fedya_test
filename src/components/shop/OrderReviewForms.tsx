"use client";

import { useActionState } from "react";
import { submitDeliveryReview, submitProductReview } from "@/app/actions/reviews";
import type { ReviewSubmitState } from "@/lib/review-submit-state";
import { moderationLabel } from "@/lib/review-display";

type Line = {
  id: number;
  productName: string;
  canWrite: boolean;
  existing: "pending" | "approved" | "rejected" | null;
};

const photoFields = (prefix: string) =>
  Array.from({ length: 5 }, (_, i) => (
    <div key={i} className="min-w-0">
      <label
        className="block text-xs text-brand-muted"
        htmlFor={`${prefix}-photo${i}`}
      >
        Фото {i + 1}
      </label>
      <input
        id={`${prefix}-photo${i}`}
        name={`photo${i}`}
        type="file"
        accept="image/*"
        className="mt-0.5 w-full max-w-full text-sm text-brand-heading file:mr-2 file:rounded file:border-0 file:bg-brand-elevated file:px-2 file:py-1"
      />
    </div>
  ));

function RatingSelect({ name }: { name: string }) {
  return (
    <div>
      <span className="text-sm font-medium text-brand-muted">Оценка</span>
      <div className="mt-1 flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-brand-border bg-brand-elevated px-3 py-1.5 text-sm has-[:checked]:border-brand-teal has-[:checked]:ring-1 has-[:checked]:ring-brand-teal/40"
          >
            <input
              type="radio"
              name={name}
              value={String(n)}
              className="sr-only"
              required={n === 1}
            />
            {n}
          </label>
        ))}
      </div>
    </div>
  );
}

export function OrderReviewForms({
  orderRef,
  token,
  minDaysAfterDelivery,
  canSubmitDelivery,
  deliveryExist,
  lines,
}: {
  orderRef: string;
  token: string;
  minDaysAfterDelivery: number;
  canSubmitDelivery: boolean;
  deliveryExist: { id: number; moderationStatus: "pending" | "approved" | "rejected" } | undefined;
  lines: Line[];
}) {
  const [dState, dAction, dPending] = useActionState<ReviewSubmitState, FormData>(
    submitDeliveryReview,
    null,
  );

  return (
    <div className="mt-8 space-y-10">
      <section className="rounded-2xl border border-brand-border bg-brand-surface/50 p-6">
        <h2 className="text-lg font-semibold text-brand-heading">Доставка</h2>
        <p className="mt-1 text-sm text-brand-muted">
          Соответствие срокам, комплектация, впечатление от получения (до 5 фото).
        </p>
        {deliveryExist ? (
          <p className="mt-4 text-sm text-brand-heading">
            Отзыв о доставке отправлен — <strong>{moderationLabel(deliveryExist.moderationStatus)}</strong>
            .
          </p>
        ) : canSubmitDelivery ? (
          <form action={dAction} className="mt-4 space-y-4">
            <input type="hidden" name="orderRef" value={orderRef} />
            <input type="hidden" name="token" value={token} />
            <RatingSelect name="rating" />
            <div>
              <label htmlFor="delivery-text" className="text-sm font-medium text-brand-muted">
                Комментарий
              </label>
              <textarea
                id="delivery-text"
                name="text"
                required
                rows={4}
                maxLength={2000}
                className="mt-1 w-full rounded-lg border border-brand-border bg-brand-elevated px-3 py-2 text-sm text-brand-heading"
                placeholder="Например, всё пришло в срок, упаковка целая…"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">{photoFields("delivery")}</div>
            {dState?.error && (
              <p className="text-sm text-red-600" role="alert">
                {dState.error}
              </p>
            )}
            {dState?.ok && <p className="text-sm text-green-700">Спасибо! Отзыв отправлен на модерацию.</p>}
            <button
              type="submit"
              disabled={dPending}
              className="rounded-xl bg-brand-teal px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-teal/90 disabled:opacity-60"
            >
              {dPending ? "Отправка…" : "Отправить отзыв о доставке"}
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-brand-muted">
            Когда заказ будет доставлен и оплачен, здесь появится форма отзыва о доставке.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-brand-heading">Товары</h2>
        {minDaysAfterDelivery > 0 && (
          <p className="mt-1 text-sm text-brand-muted">
            Отзыв о товаре после использования: не ранее {minDaysAfterDelivery} сут. после доставки.
          </p>
        )}
        <ul className="mt-4 space-y-6">
          {lines.map((line) => (
            <li
              key={line.id}
              className="rounded-2xl border border-brand-border bg-brand-elevated/40 p-5"
            >
              <h3 className="font-medium text-brand-heading">{line.productName}</h3>
              {line.existing ? (
                <p className="mt-2 text-sm text-brand-muted">
                  Отзыв отправлен — <strong>{moderationLabel(line.existing)}</strong>
                </p>
              ) : line.canWrite ? (
                <ProductReviewForm
                  orderRef={orderRef}
                  token={token}
                  orderItemId={line.id}
                  idPrefix={`p-${line.id}`}
                />
              ) : (
                <p className="mt-2 text-sm text-amber-800">
                  {minDaysAfterDelivery > 0
                    ? `Отзыв о товаре будет доступен через ${minDaysAfterDelivery} сут. после доставки (для «опыта использования»).`
                    : "Сейчас нельзя оставить отзыв (нужен статус «доставлен» и оплата)."}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ProductReviewForm({
  orderRef,
  token,
  orderItemId,
  idPrefix,
}: {
  orderRef: string;
  token: string;
  orderItemId: number;
  idPrefix: string;
}) {
  const [state, action, pending] = useActionState<ReviewSubmitState, FormData>(
    submitProductReview,
    null,
  );
  return (
    <form action={action} className="mt-3 space-y-3">
      <input type="hidden" name="orderRef" value={orderRef} />
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="orderItemId" value={String(orderItemId)} />
      <RatingSelect name="rating" />
      <div>
        <label htmlFor={`${idPrefix}-text`} className="text-sm font-medium text-brand-muted">
          Комментарий
        </label>
        <textarea
          id={`${idPrefix}-text`}
          name="text"
          required
          rows={3}
          maxLength={2000}
          className="mt-1 w-full rounded-lg border border-brand-border bg-brand-elevated px-3 py-2 text-sm text-brand-heading"
          placeholder="Как товар в использовании"
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">{photoFields(idPrefix)}</div>
      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state?.ok && <p className="text-sm text-green-700">Отзыв отправлен на модерацию.</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
      >
        {pending ? "Отправка…" : "Отправить отзыв о товаре"}
      </button>
    </form>
  );
}
