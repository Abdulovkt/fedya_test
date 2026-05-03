"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { markBankTransferPaid } from "@/app/actions/admin";

type Props = {
  orderId: number;
  paymentMethod: string;
  paymentStatus: string;
};

export function AdminMarkBankTransferPaidButton({
  orderId,
  paymentMethod,
  paymentStatus,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (paymentMethod !== "bank_transfer") return null;
  if (paymentStatus !== "pending" && paymentStatus !== "unpaid") return null;

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await markBankTransferPaid(orderId);
          router.refresh();
        });
      }}
      className="rounded-lg border border-green-700/40 bg-green-50 px-3 py-1.5 text-sm font-semibold text-green-900 transition hover:bg-green-100 disabled:opacity-60"
    >
      {pending ? "Сохранение…" : "Оплата по переводу получена"}
    </button>
  );
}
