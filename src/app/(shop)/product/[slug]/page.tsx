import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { addToCart } from "@/app/actions/cart";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { formatPrice } from "@/lib/format";

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="text-sm text-brand-muted">
        <Link href="/catalog" className="hover:text-brand-teal">
          Каталог
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/category/${row.categorySlug}`}
          className="hover:text-brand-teal"
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
          <h1 className="mt-2 text-3xl font-bold text-brand-heading">{p.name}</h1>
          <p className="mt-4 text-3xl font-bold text-brand">
            {formatPrice(p.price)}
          </p>
          {p.stock <= 0 ? (
            <p className="mt-4 text-sm text-red-400">Нет в наличии</p>
          ) : (
            <p className="mt-4 text-sm text-brand-muted">В наличии: {p.stock} шт.</p>
          )}
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
