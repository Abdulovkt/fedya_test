import { asc } from "drizzle-orm";
import { ProductForm } from "@/components/admin/ProductForm";
import { db } from "@/db";
import { categories } from "@/db/schema";

export const metadata = { title: "Новый товар" };

export default async function NewProductPage() {
  const cats = await db
    .select({
      id: categories.id,
      name: categories.name,
      parentId: categories.parentId,
      sortOrder: categories.sortOrder,
    })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  if (!cats.length) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-brand-heading">Новый товар</h1>
        <p className="mt-4 text-brand-muted">
          Сначала создайте хотя бы одну категорию.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-heading">Новый товар</h1>
      <div className="mt-8">
        <ProductForm categories={cats} mode="create" />
      </div>
    </div>
  );
}
