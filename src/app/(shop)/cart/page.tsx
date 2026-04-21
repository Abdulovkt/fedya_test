import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { getCartLines, getCartPromoCode } from "@/lib/cart";
import { getCartPricing } from "@/lib/pricing";
import { CartItemControls } from "@/components/shop/CartItemControls";
import { DiscountInfo } from "@/components/shop/DiscountInfo";
import { PromoCodeForm } from "@/components/shop/PromoCodeForm";
import { getPromoValidationError } from "@/lib/promocodes";

export const metadata = { title: "Корзина" };

export default async function CartPage() {
  const lines = await getCartLines();
  const rawPromo = await getCartPromoCode();
  const promoError = rawPromo ? getPromoValidationError(lines, rawPromo) : null;
  const appliedPromo = promoError ? null : rawPromo;
  const pricing = getCartPricing(lines, appliedPromo);

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
          <DiscountInfo subtotal={pricing.subtotal} className="mt-6" />
          <div className="mt-6">
            <PromoCodeForm
              appliedPromoCode={rawPromo?.code ?? null}
              promoDiscountPercent={pricing.promoDiscountPercent}
              promoDiscountAmount={pricing.promoDiscountAmount}
              availableAutoDiscountAmount={pricing.availableAutoDiscountAmount}
              autoDiscountRate={pricing.autoDiscountRate}
              promoError={promoError}
            />
          </div>
          <ul className="mt-8 divide-y divide-brand-border">
            {lines.map((line) => (
              <li key={line.itemId} className="flex gap-4 py-6 first:pt-0">
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
                    className="break-words font-medium text-brand-heading hover:text-brand-secondary"
                  >
                    {line.name}
                  </Link>
                  <p className="mt-1 text-sm text-brand">
                    {formatPrice(line.price)} × {line.quantity}{" "}
                    <span className="text-brand-muted">
                      = {formatPrice(line.price * line.quantity)}
                    </span>
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
                  <CartItemControls itemId={line.itemId} quantity={line.quantity} />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-4 border-t border-brand-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
              <p className="text-sm text-brand-muted">
                Сумма товаров: {formatPrice(pricing.subtotal)}
              </p>
              {pricing.appliedDiscountMode === "auto" && (
                <>
                  <p className="text-sm font-medium text-brand">
                    Скидка {pricing.autoDiscountRate}%: -{formatPrice(pricing.autoDiscountAmount)}
                  </p>
                  <p className="text-sm text-brand-muted">
                    Скидка применена автоматически по сумме заказа.
                  </p>
                </>
              )}
              {pricing.appliedDiscountMode === "promo" && (
                <>
                  <p className="text-sm font-medium text-brand">
                    Промокод {pricing.appliedPromoCode}: -{formatPrice(pricing.promoDiscountAmount)}
                  </p>
                  <p className="text-sm text-brand-muted">
                    Обычная скидка по сумме заказа не применяется, пока активен промокод.
                  </p>
                </>
              )}
              <p className="text-lg text-brand-heading">
                Итого:{" "}
                <span className="font-bold text-brand">{formatPrice(pricing.finalTotal)}</span>
              </p>
            </div>
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
