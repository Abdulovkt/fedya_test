"use client";

import { useActionState } from "react";
import { moderateCustomerReview, type ModerateReviewState } from "@/app/actions/admin-reviews";
import { moderationLabel } from "@/lib/review-display";

export function ReviewsModeration({
  reviewId,
  currentStatus,
}: {
  reviewId: number;
  currentStatus: "pending" | "approved" | "rejected";
}) {
  const [state, action, pending] = useActionState<ModerateReviewState, FormData>(
    moderateCustomerReview,
    null,
  );

  if (currentStatus === "approved") {
    return (
      <p className="mt-2 text-sm text-green-700">
        Статус: {moderationLabel("approved")}{" "}
        <a href="?filter=all" className="ml-1 text-brand-teal hover:underline">
          показать все
        </a>
      </p>
    );
  }
  if (currentStatus === "rejected") {
    return <p className="mt-2 text-sm text-brand-muted">Статус: {moderationLabel("rejected")}</p>;
  }

  return (
    <div className="mt-3 flex flex-wrap items-end gap-3">
      <form action={action} className="inline-flex">
        <input type="hidden" name="id" value={String(reviewId)} />
        <input type="hidden" name="action" value="approve" />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {pending ? "…" : "Одобрить"}
        </button>
      </form>
      <form action={action} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="id" value={String(reviewId)} />
        <input type="hidden" name="action" value="reject" />
        <input
          name="rejectionReason"
          type="text"
          placeholder="Причина (необязательно)"
          className="min-w-[12rem] rounded border border-brand-border bg-brand-elevated px-2 py-1 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 disabled:opacity-50"
        >
          Отклонить
        </button>
      </form>
      {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </div>
  );
}
