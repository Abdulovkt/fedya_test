import Image from "next/image";
import Link from "next/link";
import { addToCart } from "@/app/actions/cart";
import { formatPrice, getStockLabel } from "@/lib/format";

type Props = {
  id: number;
  name: string;
  slug: string;
  price: number;
  imageUrl: string | null;
  stock: number;
  categoryName?: string;
};

export function ProductCard({
  id,
  name,
  slug,
  price,
  imageUrl,
  stock,
  categoryName,
}: Props) {
  const stockLabel = getStockLabel(stock);

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-brand-border bg-brand-surface shadow-md shadow-black/5">
      <Link
        href={`/product/${slug}`}
        className="relative aspect-square bg-brand-elevated"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 280px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-brand-muted">
            Нет фото
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {categoryName ? (
          <p className="text-xs uppercase tracking-wide text-brand-muted">
            {categoryName}
          </p>
        ) : null}
        <Link href={`/product/${slug}`}>
          <h3 className="line-clamp-2 text-base font-semibold text-brand-heading hover:text-brand-secondary">
            {name}
          </h3>
        </Link>
        <p className="text-lg font-bold text-brand">{formatPrice(price)}</p>
        <span
          className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${stockLabel.className}`}
        >
          {stockLabel.text}
        </span>
        <form action={addToCart} className="mt-auto">
          <input type="hidden" name="productId" value={id} />
          <button
            type="submit"
            disabled={stock <= 0}
            className="w-full rounded-lg bg-brand py-2 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            В корзину
          </button>
        </form>
      </div>
    </article>
  );
}
