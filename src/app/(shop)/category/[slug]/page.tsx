import { notFound } from "next/navigation";
import { asc, count, eq } from "drizzle-orm";
import {
  CatalogCategoryGrid,
  catalogCategoryGridListClasses,
} from "@/components/shop/CatalogCategoryGrid";
import { ProductCard } from "@/components/shop/ProductCard";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { aggregateProductCountForDisplay, childrenOf, type CategoryRecord } from "@/lib/categories";
import { normalizeFulfillmentType } from "@/lib/shipping";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const [cat] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  return { title: cat?.name ?? "Категория" };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const [cat] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  if (!cat) notFound();

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

  const subcats = childrenOf(cat.id, allCategories);
  const subHubList = subcats.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    productCount: aggregateProductCountForDisplay(c, directCount, allCategories),
  }));

  const list = await db
    .select()
    .from(products)
    .where(eq(products.categoryId, cat.id))
    .orderBy(asc(products.name));

  const active = list.filter((p) => p.isActive);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-brand-heading">{cat.name}</h1>
      {subHubList.length > 0 ? (
        <>
          <h2 className="mt-10 text-xl font-semibold text-brand-heading">Подкатегории</h2>
          <CatalogCategoryGrid
            categories={subHubList}
            listClassName={`mt-4 ${catalogCategoryGridListClasses}`}
          />
        </>
      ) : null}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {active.map((p) => (
          <ProductCard
            key={p.id}
            id={p.id}
            name={p.name}
            slug={p.slug}
            price={p.price}
            imageUrl={p.imageUrl}
            stock={p.stock}
            categoryName={cat.name}
            fulfillmentType={normalizeFulfillmentType(p.fulfillmentType)}
          />
        ))}
      </div>
      {active.length === 0 ? (
        <p className="mt-8 text-brand-muted">В этой категории пока нет товаров.</p>
      ) : null}
    </div>
  );
}
