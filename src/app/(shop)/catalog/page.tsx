import { asc, eq } from "drizzle-orm";
import { ProductCard } from "@/components/shop/ProductCard";
import { db } from "@/db";
import { categories, products } from "@/db/schema";

export const metadata = {
  title: "Каталог",
};

export default async function CatalogPage() {
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
    .where(eq(products.isActive, true))
    .orderBy(asc(categories.sortOrder), asc(products.name));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-brand-heading">Каталог</h1>
      <p className="mt-2 text-brand-muted">
        Все активные товары. Выберите категорию в меню или откройте карточку.
      </p>
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
      {list.length === 0 ? (
        <p className="mt-8 text-brand-muted">Товары скоро появятся.</p>
      ) : null}
    </div>
  );
}
