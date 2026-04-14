"use client";

import { useTransition, useState, useEffect } from "react";
import { updateCartItemQuantity, removeCartItem } from "@/app/actions/cart";

interface CartItemControlsProps {
  itemId: number;
  quantity: number;
}

export function CartItemControls({ itemId, quantity }: CartItemControlsProps) {
  const [isPending, startTransition] = useTransition();
  const [inputValue, setInputValue] = useState(String(quantity));

  // Sync input when server re-renders with new quantity
  useEffect(() => {
    setInputValue(String(quantity));
  }, [quantity]);

  function update(newQty: number) {
    if (!Number.isFinite(newQty) || newQty < 0) return;
    setInputValue(String(newQty));
    startTransition(async () => {
      const fd = new FormData();
      fd.set("itemId", String(itemId));
      fd.set("quantity", String(newQty));
      await updateCartItemQuantity(fd);
    });
  }

  function remove() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("itemId", String(itemId));
      await removeCartItem(fd);
    });
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
  }

  function handleBlur() {
    const parsed = parseInt(inputValue, 10);
    if (!Number.isFinite(parsed) || parsed === quantity) {
      // Reset to current quantity if input is invalid or unchanged
      setInputValue(String(quantity));
      return;
    }
    update(parsed);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
    if (e.key === "Escape") {
      setInputValue(String(quantity));
      e.currentTarget.blur();
    }
  }

  return (
    <div
      className={`mt-2 flex flex-wrap items-center gap-3 transition-opacity ${isPending ? "opacity-50 pointer-events-none" : ""}`}
    >
      <div className="flex items-center gap-1">
        <button
          onClick={() => update(quantity - 1)}
          disabled={isPending}
          aria-label="Уменьшить"
          className="flex h-7 w-7 items-center justify-center rounded border border-brand-border text-brand-heading hover:bg-brand-elevated disabled:cursor-not-allowed"
        >
          −
        </button>
        <input
          type="number"
          min={1}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={isPending}
          className="w-12 rounded border border-brand-border bg-brand-surface px-1 py-0.5 text-center text-sm tabular-nums text-brand-heading focus:outline-none focus:ring-1 focus:ring-brand disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          aria-label="Количество"
        />
        <button
          onClick={() => update(quantity + 1)}
          disabled={isPending}
          aria-label="Увеличить"
          className="flex h-7 w-7 items-center justify-center rounded border border-brand-border text-brand-heading hover:bg-brand-elevated disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>

      <button
        onClick={remove}
        disabled={isPending}
        className="text-xs text-red-400 hover:underline disabled:opacity-50"
      >
        Удалить
      </button>
    </div>
  );
}
