import type { QualityTier } from "@/lib/product-quality";
import { qualityTierLabel } from "@/lib/product-quality";

type Props = { tier: QualityTier; className?: string };

export function ProductQualityBadge({ tier, className = "" }: Props) {
  const label = qualityTierLabel(tier);
  const shell =
    tier === "economy"
      ? "border-slate-200/90 bg-slate-100/90 text-slate-700"
      : tier === "premium"
        ? "border-amber-200/90 bg-amber-50/95 text-amber-950"
        : "border-brand-border bg-brand-elevated/90 text-brand-heading";

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${shell} ${className}`.trim()}
    >
      {label}
    </span>
  );
}
