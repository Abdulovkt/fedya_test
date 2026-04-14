"use client";

import { useState, useTransition, useRef } from "react";
import { ORDER_STATUSES } from "@/lib/order-statuses";
import { updateOrderStatus } from "@/app/actions/admin";

interface Props {
  orderId: number;
  current: string;
}

const NEEDS_MESSAGE = "shipped";

export function OrderStatusChanger({ orderId, current }: Props) {
  const [optimistic, setOptimistic] = useState(current);
  const [isPending, startTransition] = useTransition();
  // Which status is awaiting confirmation (needs a message)
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function handleClick(value: string) {
    if (value === optimistic) return;

    if (value === NEEDS_MESSAGE) {
      // Show message form instead of submitting immediately
      setPendingStatus(value);
      setMessage("");
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }

    submit(value, "");
  }

  function submit(status: string, msg: string) {
    setOptimistic(status);
    setPendingStatus(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("orderId", String(orderId));
      fd.set("status", status);
      if (msg.trim()) fd.set("message", msg.trim());
      await updateOrderStatus(fd);
    });
  }

  function cancelPending() {
    setPendingStatus(null);
    setMessage("");
  }

  return (
    <div className={isPending ? "opacity-60 pointer-events-none" : ""}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-muted">
        Статус заказа
      </p>

      <div className="flex flex-wrap gap-2">
        {ORDER_STATUSES.map((s) => {
          const active = optimistic === s.value;
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => handleClick(s.value)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                active
                  ? `${s.color} ring-2 ring-offset-1 ring-current`
                  : "border-brand-border bg-brand-elevated text-brand-muted hover:border-current hover:text-brand-heading"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Inline form for statuses that require a message */}
      {pendingStatus === NEEDS_MESSAGE && (
        <div className="mt-3 rounded-xl border border-brand-border bg-brand-surface p-4">
          <label className="mb-1.5 block text-xs font-semibold text-brand-muted">
            Сообщение для клиента (трек-номер, детали доставки)
          </label>
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Например: трек-номер RM123456789RU, отслеживание на pochta.ru"
            className="w-full rounded-lg border border-brand-border bg-brand-elevated px-3 py-2 text-sm text-brand-heading placeholder:text-brand-muted focus:outline-none focus:ring-1 focus:ring-brand resize-none"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => submit(pendingStatus, message)}
              className="rounded-lg bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-hover"
            >
              Подтвердить отправку
            </button>
            <button
              type="button"
              onClick={cancelPending}
              className="rounded-lg border border-brand-border px-4 py-1.5 text-sm text-brand-muted hover:bg-brand-elevated"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
