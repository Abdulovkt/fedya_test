import { asc, and, count, eq } from "drizzle-orm";
import Link from "next/link";
import { ProductCard } from "@/components/shop/ProductCard";
import { CatalogCategoryGrid } from "@/components/shop/CatalogCategoryGrid";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { aggregateProductCountForDisplay, type CategoryRecord } from "@/lib/categories";
import { normalizeFulfillmentType } from "@/lib/shipping";

export const metadata = { title: "Каталог" };

type SearchParams = Promise<{
  q?: string;
  category?: string;
  /** Показать сетку всех товаров (старый режим) */
  view?: string;
}>;

function isViewAll(view: string | undefined): boolean {
  return (view ?? "").trim().toLowerCase() === "all";
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q, category, view } = await searchParams;
  const needle = q?.trim().toLowerCase() ?? "";
  const showProductGrid = Boolean(needle || category?.trim() || isViewAll(view));
  const showCategoryHub = !showProductGrid;

  if (showCategoryHub) {
    const allCategories = (await db
      .select()
      .from(categories)
      .orderBy(asc(categories.sortOrder), asc(categories.name))) as CategoryRecord[];

    const countRows = await db
      .select({ categoryId: products.categoryId, c: count() })
      .from(products)
      .where(eq(products.isActive, true))
      .groupBy(products.categoryId);

    const directCount = new Map<number, number>(
      countRows.map((r) => [r.categoryId, Number(r.c)]),
    );

    const roots = allCategories.filter((c) => c.parentId == null);

    const hubList = roots.map((root) => ({
      id: root.id,
      name: root.name,
      slug: root.slug,
      productCount: aggregateProductCountForDisplay(root, directCount, allCategories),
    }));

    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-brand-heading">Каталог</h1>
        <p className="mt-2 max-w-2xl text-brand-muted">
          Выберите раздел, чтобы смотреть товары. Или сразу{" "}
          <Link
            href="/catalog?view=all"
            className="font-medium text-brand hover:text-brand-teal hover:underline focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand-teal/50 focus-visible:ring-offset-2"
          >
            открыть все товары списком
          </Link>
          .
        </p>

        {hubList.length > 0 ? (
          <CatalogCategoryGrid categories={hubList} />
        ) : (
          <p className="mt-8 text-brand-muted">Категории скоро появятся.</p>
        )}
      </div>
    );
  }

  const conditions = [eq(products.isActive, true)];
  if (category?.trim()) conditions.push(eq(categories.slug, category.trim()));

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      imageUrl: products.imageUrl,
      stock: products.stock,
      categoryName: categories.name,
      fulfillmentType: products.fulfillmentType,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(asc(categories.sortOrder), asc(products.name));

  const list = needle
    ? rows.filter((p) => p.name.toLowerCase().includes(needle))
    : rows;

  const title = needle
    ? `Результаты поиска: «${q!.trim()}»`
    : category
      ? (list[0]?.categoryName ?? "Каталог")
      : isViewAll(view)
        ? "Все товары"
        : "Каталог";

  const isAllProducts = isViewAll(view) && !needle && !category;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-brand-heading">{title}</h1>
      {isAllProducts && (
        <p className="mt-2 text-brand-muted">
          Все активные товары.{" "}
          <Link
            href="/catalog"
            className="font-medium text-brand hover:text-brand-teal hover:underline focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand-teal/50 focus-visible:ring-offset-2"
          >
            Смотреть по категориям
          </Link>
        </p>
      )}

      {list.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              name={p.name}
              slug={p.slug}
              price={p.price}
              imageUrl={p.imageUrl}
              stock={p.stock}
              categoryName={p.categoryName}
              fulfillmentType={normalizeFulfillmentType(p.fulfillmentType)}
            />
          ))}
        </div>
      ) : (
        <p className="mt-8 text-brand-muted">
          {needle
            ? `По запросу «${q!.trim()}» ничего не найдено.`
            : "Товары скоро появятся."}
        </p>
      )}
    </div>
  );
}
