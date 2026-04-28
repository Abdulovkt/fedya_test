import Image from "next/image";
import Link from "next/link";
import { addToCart } from "@/app/actions/cart";
import { ProductQualityBadge } from "@/components/shop/ProductQualityBadge";
import { formatPrice, getStockLabel } from "@/lib/format";
import type { QualityTier } from "@/lib/product-quality";
import { isPublicUploadPath } from "@/lib/public-assets";
import { fulfillmentLabel, type FulfillmentType } from "@/lib/shipping";

type Props = {
  id: number;
  name: string;
  slug: string;
  price: number;
  imageUrl: string | null;
  stock: number;
  categoryName?: string;
  fulfillmentType?: FulfillmentType;
  qualityTier?: QualityTier;
};

export function ProductCard({
  id,
  name,
  slug,
  price,
  imageUrl,
  stock,
  categoryName,
  fulfillmentType,
  qualityTier,
}: Props) {
  const stockLabel = getStockLabel(stock);
  const href = `/product/${slug}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-brand-surface shadow-sm shadow-slate-900/5 transition-all duration-200 hover:border-slate-300 hover:shadow-md hover:shadow-slate-900/10">
      <Link
        href={href}
        className="flex min-h-0 flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:ring-offset-2"
      >
        <div className="relative aspect-square overflow-hidden bg-brand-elevated">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              unoptimized={isPublicUploadPath(imageUrl)}
              className="object-cover transition-transform duration-300 will-change-transform motion-reduce:transition-none motion-reduce:group-hover:scale-100 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 100vw, 280px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-brand-muted">
              Нет фото
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          {categoryName ? (
            <p className="text-xs uppercase tracking-wide text-brand-muted">
              {categoryName}
            </p>
          ) : null}
          <h3 className="line-clamp-2 text-base font-semibold tracking-tight text-brand-heading group-hover:text-brand-secondary">
            {name}
          </h3>
          <p className="text-lg font-bold tabular-nums text-brand">{formatPrice(price)}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {qualityTier ? <ProductQualityBadge tier={qualityTier} /> : null}
            <span
              className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${stockLabel.className}`}
            >
              {stockLabel.text}
            </span>
            {fulfillmentType ? (
              <span className="w-fit rounded-full border border-brand-border bg-brand-elevated/80 px-2 py-0.5 text-[11px] text-brand-muted">
                {fulfillmentLabel(fulfillmentType)}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
      <form action={addToCart} className="border-t border-slate-200/80 px-4 pb-4 pt-3">
        <input type="hidden" name="productId" value={id} />
        <button
          type="submit"
          disabled={stock <= 0}
          className="w-full cursor-pointer rounded-lg bg-brand-teal py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-teal/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          В корзину
        </button>
      </form>
    </article>
  );
}
