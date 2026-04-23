import Link from "next/link";
import { CheckoutForm } from "@/components/shop/CheckoutForm";
import { DiscountInfo } from "@/components/shop/DiscountInfo";
import { PromoCodeForm } from "@/components/shop/PromoCodeForm";
import { formatPrice } from "@/lib/format";
import { getCartLines, getCartPromoCode } from "@/lib/cart";
import { getCheckoutAmounts } from "@/lib/pricing";
import { getPromoValidationError } from "@/lib/promocodes";
import { getSettings, getDeliveryFeesKopecksFromSettings } from "@/lib/settings";
import { fulfillmentLabel, type FulfillmentType } from "@/lib/shipping";

export const metadata = { title: "Оформление заказа" };

const FULFILLMENT_ORDER: FulfillmentType[] = ["russian_post", "cdek"];

export default async function CheckoutPage() {
  const lines = await getCartLines();
  const rawPromo = await getCartPromoCode();
  const promoError = rawPromo ? getPromoValidationError(lines, rawPromo) : null;
  const appliedPromo = promoError ? null : rawPromo;

  const settings = await getSettings();
  const fees = getDeliveryFeesKopecksFromSettings(settings);
  const priceLines = lines.map((l) => ({
    productId: l.productId,
    price: l.price,
    quantity: l.quantity,
  }));
  const amounts = getCheckoutAmounts(priceLines, lines, appliedPromo, {
    postKopecks: fees.postKopecks,
    cdekKopecks: fees.cdekKopecks,
  });
  const pricing = amounts.pricing;
  const { delivery } = amounts;
  const needsCdekPickup = delivery.hasCdek;
  const hasRussianPost = delivery.hasPost;

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-brand-heading">Корзина пуста</h1>
        <p className="mt-4 text-brand-muted">Добавьте товары, чтобы оформить заказ.</p>
        <Link
          href="/catalog"
          className="mt-6 inline-block rounded-xl bg-brand-teal px-6 py-2 font-semibold text-white transition-colors duration-200 hover:bg-brand-teal/90"
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
        <CheckoutForm
          promoCode={rawPromo?.code ?? null}
          needsCdekPickup={needsCdekPickup}
          hasRussianPost={hasRussianPost}
        />
        <div>
          <h2 className="text-lg font-semibold text-brand-heading">Состав заказа</h2>
          <DiscountInfo compact className="mt-4" subtotal={pricing.subtotal} />
          <div className="mt-4">
            <PromoCodeForm
              appliedPromoCode={rawPromo?.code ?? null}
              promoDiscountPercent={pricing.promoDiscountPercent}
              promoDiscountAmount={pricing.promoDiscountAmount}
              availableAutoDiscountAmount={pricing.availableAutoDiscountAmount}
              autoDiscountRate={pricing.autoDiscountRate}
              promoError={promoError}
            />
          </div>
          {needsCdekPickup && (
            <p className="mt-3 rounded-lg border border-brand-border bg-brand-surface/50 px-3 py-2 text-xs text-brand-muted">
              В заказе есть товары с отгрузкой СДЭК — в форме слева укажите{" "}
              <span className="font-medium text-brand-heading">точный адрес ПВЗ</span> (как в
              личном кабинете/на карте СДЭК), иначе заказ не оформить.
            </p>
          )}
          <div className="mt-4 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
              Отправления
            </h3>
            {FULFILLMENT_ORDER.map((ft) => {
              const group = lines.filter((l) => l.fulfillmentType === ft);
              if (!group.length) return null;
              return (
                <div key={ft}>
                  <p className="text-xs text-brand">{fulfillmentLabel(ft)}</p>
                  <ul className="mt-1 space-y-2 text-sm text-brand-muted">
                    {group.map((l) => (
                      <li key={l.itemId} className="flex justify-between gap-4">
                        <span className="min-w-0 flex-1 break-words text-brand-heading">
                          {l.name} × {l.quantity}
                        </span>
                        <span className="shrink-0 tabular-nums">
                          {formatPrice(l.price * l.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <div className="mt-4 space-y-2 border-t border-brand-border pt-4">
            <p className="flex justify-between gap-4 text-sm text-brand-muted">
              <span>Сумма товаров</span>
              <span>{formatPrice(pricing.subtotal)}</span>
            </p>
            {pricing.appliedDiscountMode === "auto" && (
              <>
                <p className="flex justify-between gap-4 text-sm font-medium text-brand">
                  <span>Скидка {pricing.autoDiscountRate}%</span>
                  <span>-{formatPrice(pricing.autoDiscountAmount)}</span>
                </p>
                <p className="text-sm text-brand-muted">
                  Скидка применена автоматически по сумме заказа.
                </p>
              </>
            )}
            {pricing.appliedDiscountMode === "promo" && (
              <>
                <p className="flex justify-between gap-4 text-sm font-medium text-brand">
                  <span>Промокод {pricing.appliedPromoCode}</span>
                  <span>-{formatPrice(pricing.promoDiscountAmount)}</span>
                </p>
                <p className="text-sm text-brand-muted">
                  Автоматическая скидка по сумме заказа отключена, пока активен промокод.
                </p>
              </>
            )}
            <p className="flex justify-between gap-4 text-sm text-brand-muted">
              <span>Товары со скидкой</span>
              <span>{formatPrice(pricing.finalTotal)}</span>
            </p>
            {delivery.postKopecks > 0 && (
              <p className="flex justify-between gap-4 text-sm text-brand-muted">
                <span>Доставка Почта России</span>
                <span>{formatPrice(delivery.postKopecks)}</span>
              </p>
            )}
            {delivery.hasCdek && (
              <p className="flex justify-between gap-4 text-sm text-brand-muted">
                <span>Доставка СДЭК</span>
                <span className="text-right">оплачивается отдельно</span>
              </p>
            )}
            <p className="flex justify-between gap-4 text-lg text-brand-heading">
              <span>К оплате</span>
              <span className="font-bold text-brand">
                {formatPrice(amounts.payableTotalKopecks)}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
