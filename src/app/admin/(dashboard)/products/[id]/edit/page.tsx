import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { ProductForm } from "@/components/admin/ProductForm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const [p] = await db
    .select()
    .from(products)
    .where(eq(products.id, Number(id)))
    .limit(1);
  return { title: p ? `Редактировать: ${p.name}` : "Товар" };
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isFinite(pid)) notFound();

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, pid))
    .limit(1);
  if (!product) notFound();

  const cats = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-heading">Редактировать товар</h1>
      <div className="mt-8">
        <ProductForm
          categories={cats}
          mode="edit"
          product={{
            id: product.id,
            categoryId: product.categoryId,
            name: product.name,
            slug: product.slug,
            description: product.description,
            priceKopecks: product.price,
            costKopecks: product.cost,
            stock: product.stock,
            isActive: product.isActive,
            imageUrl: product.imageUrl,
          }}
        />
      </div>
    </div>
  );
}
