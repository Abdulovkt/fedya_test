import { asc, eq, like, and } from "drizzle-orm";
import { ProductCard } from "@/components/shop/ProductCard";
import { db } from "@/db";
import { categories, products } from "@/db/schema";

export const metadata = { title: "Каталог" };

type SearchParams = Promise<{ q?: string; category?: string }>;

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q, category } = await searchParams;

  const conditions = [eq(products.isActive, true)];
  if (q?.trim()) conditions.push(like(products.name, `%${q.trim()}%`));
  if (category?.trim()) conditions.push(eq(categories.slug, category.trim()));

  const list = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      imageUrl: products.imageUrl,
      categoryName: categories.name,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(asc(categories.sortOrder), asc(products.name));

  const title =
    q?.trim()
      ? `Результаты поиска: «${q.trim()}»`
      : category
        ? list[0]?.categoryName ?? "Каталог"
        : "Каталог";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-brand-heading">{title}</h1>
      {!q && !category && (
        <p className="mt-2 text-brand-muted">
          Все активные товары. Выберите категорию в меню или откройте карточку.
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
              categoryName={p.categoryName}
            />
          ))}
        </div>
      ) : (
        <p className="mt-8 text-brand-muted">
          {q?.trim()
            ? `По запросу «${q.trim()}» ничего не найдено.`
            : "Товары скоро появятся."}
        </p>
      )}
    </div>
  );
}
