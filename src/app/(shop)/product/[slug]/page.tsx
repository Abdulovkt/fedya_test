import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { addToCart } from "@/app/actions/cart";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { formatPrice, getStockLabel } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const [p] = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);
  return { title: p?.name ?? "Товар" };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [row] = await db
    .select({
      product: products,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.slug, slug))
    .limit(1);

  if (!row || !row.product.isActive) notFound();

  const p = row.product;
  const stockLabel = getStockLabel(p.stock);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-brand-muted sm:text-sm">
        <Link href="/catalog" className="hover:text-brand-teal">
          Каталог
        </Link>
        <span className="text-brand-muted/60" aria-hidden="true">
          /
        </span>
        <Link
          href={`/category/${row.categorySlug}`}
          className="min-w-0 break-words hover:text-brand-teal"
        >
          {row.categoryName}
        </Link>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-brand-border bg-brand-surface">
          {p.imageUrl ? (
            <Image
              src={p.imageUrl}
              alt={p.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-brand-muted">
              Нет фото
            </div>
          )}
        </div>
        <div>
          <p className="text-sm uppercase tracking-wide text-brand-muted">
            {row.categoryName}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-brand-heading sm:text-3xl">
            {p.name}
          </h1>
          <p className="mt-4 text-2xl font-bold text-brand sm:text-3xl">
            {formatPrice(p.price)}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${stockLabel.className}`}
            >
              {stockLabel.text}
            </span>
            {p.stock > 0 && (
              <span className="text-sm text-brand-muted">{p.stock} шт.</span>
            )}
          </div>
          {p.description ? (
            <div className="prose prose-neutral mt-6 max-w-none text-brand-muted prose-p:leading-relaxed">
              <p className="whitespace-pre-wrap">{p.description}</p>
            </div>
          ) : null}
          <form action={addToCart} className="mt-8">
            <input type="hidden" name="productId" value={p.id} />
            <button
              type="submit"
              disabled={p.stock <= 0}
              className="rounded-xl bg-brand px-8 py-3 text-base font-semibold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              В корзину
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
