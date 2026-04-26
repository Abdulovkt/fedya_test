import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, count, eq, isNull } from "drizzle-orm";
import { EditCategoryForm } from "@/components/admin/EditCategoryForm";
import { db } from "@/db";
import { categories } from "@/db/schema";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isFinite(pid)) {
    return { title: "Категория" };
  }
  const [c] = await db.select().from(categories).where(eq(categories.id, pid)).limit(1);
  return { title: c ? `Редактировать: ${c.name}` : "Категория" };
}

export default async function EditCategoryPage({ params }: Props) {
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isFinite(pid)) notFound();

  const [cat] = await db.select().from(categories).where(eq(categories.id, pid)).limit(1);
  if (!cat) notFound();

  const [childRow] = await db
    .select({ n: count() })
    .from(categories)
    .where(eq(categories.parentId, cat.id));
  const hasSubcategories = childRow && Number(childRow.n) > 0;

  const rootCategories = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(isNull(categories.parentId))
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  return (
    <div>
      <Link
        href="/admin/categories"
        className="text-sm text-brand hover:underline"
      >
        ← К списку категорий
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-brand-heading">Редактировать категорию</h1>
      <p className="mt-1 max-w-lg text-sm text-brand-muted">
        Измените название, slug, порядок или вложенность. Менять родителя можно только у категорий
        без своих подкатегорий; разделы с вложенными подкатегориями остаются корневыми.
      </p>
      <EditCategoryForm
        category={{
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          sortOrder: cat.sortOrder,
          parentId: cat.parentId,
        }}
        hasSubcategories={hasSubcategories}
        rootCategories={rootCategories}
      />
    </div>
  );
}
