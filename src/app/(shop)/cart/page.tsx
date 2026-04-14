import Image from "next/image";
import Link from "next/link";
import { removeCartItem, updateCartItemQuantity } from "@/app/actions/cart";
import { formatPrice } from "@/lib/format";
import { getCartLines } from "@/lib/cart";

export const metadata = { title: "Корзина" };

export default async function CartPage() {
  const lines = await getCartLines();
  const total = lines.reduce((s, l) => s + l.price * l.quantity, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-brand-heading">Корзина</h1>
      {lines.length === 0 ? (
        <p className="mt-6 text-brand-muted">
          Корзина пуста.{" "}
          <Link href="/catalog" className="text-brand hover:underline">
            Перейти в каталог
          </Link>
        </p>
      ) : (
        <>
          <ul className="mt-8 divide-y divide-brand-border">
            {lines.map((line) => (
              <li
                key={line.itemId}
                className="flex gap-4 py-6 first:pt-0"
              >
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-brand-border bg-brand-surface">
                  {line.imageUrl ? (
                    <Image
                      src={line.imageUrl}
                      alt={line.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-brand-muted">
                      нет
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/product/${line.slug}`}
                    className="font-medium text-brand-heading hover:text-brand-secondary"
                  >
                    {line.name}
                  </Link>
                  <p className="mt-1 text-sm text-brand">
                    {formatPrice(line.price)} × {line.quantity}
                  </p>
                  {line.reservedUntil && (
                    <p className="mt-0.5 text-xs text-brand-muted">
                      Зарезервировано до{" "}
                      {line.reservedUntil.toLocaleString("ru-RU", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <form action={updateCartItemQuantity} className="flex items-center gap-2">
                      <input type="hidden" name="itemId" value={line.itemId} />
                      <label className="sr-only" htmlFor={`q-${line.itemId}`}>
                        Количество
                      </label>
                      <input
                        id={`q-${line.itemId}`}
                        name="quantity"
                        type="number"
                        min={1}
                        defaultValue={line.quantity}
                        className="w-20 rounded border border-brand-border bg-brand-surface px-2 py-1 text-sm text-brand-heading"
                      />
                      <button
                        type="submit"
                        className="rounded border border-brand-border px-2 py-1 text-xs text-brand-heading hover:bg-brand-elevated"
                      >
                        Обновить
                      </button>
                    </form>
                    <form action={removeCartItem}>
                      <input type="hidden" name="itemId" value={line.itemId} />
                      <button
                        type="submit"
                        className="text-xs text-red-400 hover:underline"
                      >
                        Удалить
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-4 border-t border-brand-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-lg text-brand-heading">
              Итого:{" "}
              <span className="font-bold text-brand">{formatPrice(total)}</span>
            </p>
            <Link
              href="/checkout"
              className="inline-flex justify-center rounded-xl bg-brand px-8 py-3 font-semibold text-white hover:bg-brand-hover"
            >
              Оформить заказ
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
