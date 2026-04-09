import Link from "next/link";
import { CheckoutForm } from "@/components/shop/CheckoutForm";
import { formatPrice } from "@/lib/format";
import { getCartLines } from "@/lib/cart";

export const metadata = { title: "Оформление заказа" };

export default async function CheckoutPage() {
  const lines = await getCartLines();
  const total = lines.reduce((s, l) => s + l.price * l.quantity, 0);

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-brand-heading">Корзина пуста</h1>
        <p className="mt-4 text-brand-muted">
          Добавьте товары, чтобы оформить заказ.
        </p>
        <Link
          href="/catalog"
          className="mt-6 inline-block rounded-xl bg-brand px-6 py-2 font-semibold text-white"
        >
          В каталог
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-brand-heading">Оформление заказа</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <CheckoutForm />
        <div>
          <h2 className="text-lg font-semibold text-brand-heading">Состав заказа</h2>
          <ul className="mt-4 space-y-2 text-sm text-brand-muted">
            {lines.map((l) => (
              <li key={l.itemId} className="flex justify-between gap-4">
                <span className="text-brand-heading">
                  {l.name} × {l.quantity}
                </span>
                <span>{formatPrice(l.price * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-brand-border pt-4 text-lg text-brand-heading">
            К оплате:{" "}
            <span className="font-bold text-brand">{formatPrice(total)}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
