"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { refreshOrderPaymentSync } from "@/app/actions/checkout-success";

const INTERVAL_MS = 6000;
const MAX_TICKS = 50;

export function CheckoutSuccessPaymentPoller({
  orderRef,
  token,
}: {
  orderRef: string;
  token: string;
}) {
  const router = useRouter();
  const ticks = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    async function tick() {
      if (cancelled || ticks.current >= MAX_TICKS) return;
      ticks.current += 1;
      const res = await refreshOrderPaymentSync(orderRef, token);
      if (cancelled) return;
      if (res.ok) {
        router.refresh();
        if ("final" in res && res.final && intervalId) {
          clearInterval(intervalId);
        }
      }
    }

    void tick();
    intervalId = setInterval(() => void tick(), INTERVAL_MS);
    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [orderRef, token, router]);

  return null;
}
