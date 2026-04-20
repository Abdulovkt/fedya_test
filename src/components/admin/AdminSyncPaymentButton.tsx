"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { syncOrderPaymentStatusForOrder } from "@/app/actions/admin";

function PaymentSyncSpinner() {
  return (
    <span className="relative inline-flex h-4 w-4 shrink-0" aria-hidden>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/40 opacity-60" />
      <span className="relative m-0.5 inline-flex h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
    </span>
  );
}

type Props = {
  orderId: number;
  className?: string;
};

export function AdminSyncPaymentButton({ orderId, className = "" }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={(e) => {
        e.stopPropagation();
        startTransition(async () => {
          await syncOrderPaymentStatusForOrder(orderId);
          router.refresh();
        });
      }}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover disabled:pointer-events-none disabled:opacity-70 ${className}`}
    >
      {isPending ? (
        <>
          <PaymentSyncSpinner />
          <span>Обновляем оплату…</span>
        </>
      ) : (
        "Обновить статус оплаты"
      )}
    </button>
  );
}
