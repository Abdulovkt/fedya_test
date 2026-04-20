import { desc, eq } from "drizzle-orm";
import { deletePromoCode } from "@/app/actions/admin";
import { PromoCodeForm } from "@/components/admin/PromoCodeForm";
import { db } from "@/db";
import { products, promoCodeProducts, promoCodes } from "@/db/schema";

export const metadata = { title: "Промокоды" };

export default async function AdminPromoCodesPage() {
  const [promoList, productList, promoProducts] = await Promise.all([
    db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt)),
    db.select({ id: products.id, name: products.name }).from(products),
    db
      .select({
        promoCodeId: promoCodeProducts.promoCodeId,
        productName: products.name,
      })
      .from(promoCodeProducts)
      .innerJoin(products, eq(promoCodeProducts.productId, products.id)),
  ]);

  const productsByPromo = new Map<number, string[]>();
  for (const row of promoProducts) {
    const list = productsByPromo.get(row.promoCodeId) ?? [];
    list.push(row.productName);
    productsByPromo.set(row.promoCodeId, list);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-brand-heading">Промокоды</h1>
        <p className="mt-2 text-sm text-brand-muted">
          Новый промокод будет автоматически отправлен клиентам, у которых уже есть заказы с email.
        </p>
      </div>

      <PromoCodeForm products={productList} />

      <div className="overflow-x-auto rounded-xl border border-brand-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-surface/80 text-brand-muted">
            <tr>
              <th className="px-4 py-2">Код</th>
              <th className="px-4 py-2">Скидка</th>
              <th className="px-4 py-2">Период</th>
              <th className="px-4 py-2">Товары</th>
              <th className="px-4 py-2">Статус</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {promoList.map((promo) => {
              const isActiveNow =
                promo.isActive &&
                promo.startsAt <= new Date() &&
                promo.endsAt >= new Date();

              return (
                <tr key={promo.id} className="border-t border-brand-border align-top">
                  <td className="px-4 py-3 font-semibold text-brand">{promo.code}</td>
                  <td className="px-4 py-3 text-brand-heading">{promo.discountPercent}%</td>
                  <td className="px-4 py-3 text-brand-muted">
                    <div>{promo.startsAt.toLocaleString("ru-RU")}</div>
                    <div className="mt-1">до {promo.endsAt.toLocaleString("ru-RU")}</div>
                  </td>
                  <td className="px-4 py-3 text-brand-muted">
                    {promo.appliesToAll
                      ? "Все товары"
                      : (productsByPromo.get(promo.id) ?? []).join(", ")}
                  </td>
                  <td className="px-4 py-3">
                    {isActiveNow ? (
                      <span className="text-emerald-400">активен</span>
                    ) : promo.isActive ? (
                      <span className="text-amber-400">вне периода</span>
                    ) : (
                      <span className="text-brand-muted">отключён</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={deletePromoCode}>
                      <input type="hidden" name="id" value={promo.id} />
                      <button
                        type="submit"
                        className="text-xs text-red-400 hover:underline"
                      >
                        Удалить
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
