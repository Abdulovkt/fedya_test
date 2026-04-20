import { formatPrice } from "@/lib/format";
import { DISCOUNT_RULES, getDiscountRate } from "@/lib/pricing";

type DiscountInfoProps = {
  compact?: boolean;
  subtotal?: number;
  className?: string;
};

function getRangeLabel(index: number) {
  const rules = DISCOUNT_RULES.slice().reverse();
  const rule = rules[index];
  const nextRule = rules[index + 1];

  if (!rule) {
    return "";
  }

  if (!nextRule) {
    return `от ${formatPrice(rule.minAmount)}`;
  }

  return `от ${formatPrice(rule.minAmount)} до ${formatPrice(nextRule.minAmount)}`;
}

export function DiscountInfo({
  compact = false,
  subtotal = 0,
  className = "",
}: DiscountInfoProps) {
  const rules = DISCOUNT_RULES.slice().reverse();
  const currentRate = getDiscountRate(subtotal);

  if (compact) {
    return (
      <div
        className={`rounded-xl border border-brand-teal/30 bg-brand-teal/10 px-3 py-2 text-xs text-brand-heading sm:text-sm ${className}`}
      >
        <span className="font-semibold">Скидки по сумме заказа:</span>{" "}
        {rules.map((rule, index) => (
          <span key={rule.percent}>
            {index > 0 ? " " : ""}
            {getRangeLabel(index)} - {rule.percent}%
            {index < rules.length - 1 ? ";" : "."}
          </span>
        ))}
      </div>
    );
  }

  return (
    <section
      className={`rounded-2xl border border-brand-teal/25 bg-brand-surface p-5 shadow-sm ${className}`}
    >
      <h2 className="text-lg font-semibold text-brand-heading">Система скидок</h2>
      <p className="mt-2 text-sm text-brand-muted">
        Скидка применяется автоматически в зависимости от суммы товаров в корзине.
      </p>
      <ul className="mt-4 space-y-2">
        {rules.map((rule, index) => {
          const isActive = currentRate === rule.percent;

          return (
            <li
              key={rule.percent}
              className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm ${
                isActive
                  ? "border-brand-teal/40 bg-brand-teal/10 text-brand-heading"
                  : "border-brand-border bg-brand-elevated/40 text-brand-muted"
              }`}
            >
              <span>{getRangeLabel(index)}</span>
              <span className="font-semibold text-brand">{rule.percent}%</span>
            </li>
          );
        })}
      </ul>
      {currentRate > 0 && (
        <p className="mt-3 text-sm font-medium text-brand">
          Для текущей суммы заказа активна скидка {currentRate}%.
        </p>
      )}
    </section>
  );
}
