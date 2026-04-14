import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { deleteProduct } from "@/app/actions/admin";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { formatPrice } from "@/lib/format";
import { AutoRefresh } from "@/components/admin/AutoRefresh";

export const dynamic = "force-dynamic";
export const metadata = { title: "Товары" };

export default async function AdminProductsPage() {
  const list = await db
    .select({
      product: products,
      categoryName: categories.name,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(asc(products.name));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-brand-heading">Товары</h1>
          <AutoRefresh intervalMs={5000} />
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover"
        >
          Новый товар
        </Link>
      </div>
      <div className="mt-8 overflow-x-auto rounded-xl border border-brand-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-surface/80 text-brand-muted">
            <tr>
              <th className="px-4 py-2">Название</th>
              <th className="px-4 py-2">Категория</th>
              <th className="px-4 py-2">Цена</th>
              <th className="px-4 py-2 text-right">Остаток</th>
              <th className="px-4 py-2">Статус</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {list.map(({ product, categoryName }) => (
              <tr key={product.id} className="border-t border-brand-border">
                <td className="px-4 py-2 text-brand-heading">{product.name}</td>
                <td className="px-4 py-2 text-brand-muted">{categoryName}</td>
                <td className="px-4 py-2">{formatPrice(product.price)}</td>
                <td className="px-4 py-2 text-right tabular-nums">
                  <span
                    className={
                      product.stock === 0
                        ? "text-red-400"
                        : product.stock <= 5
                          ? "text-amber-400"
                          : "text-brand-heading"
                    }
                  >
                    {product.stock}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {product.isActive ? (
                    <span className="text-emerald-400">активен</span>
                  ) : (
                    <span className="text-brand-muted">скрыт</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="mr-3 text-xs text-brand hover:underline"
                  >
                    Изменить
                  </Link>
                  <form action={deleteProduct} className="inline">
                    <input type="hidden" name="id" value={product.id} />
                    <button
                      type="submit"
                      className="text-xs text-red-400 hover:underline"
                    >
                      Удалить
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
