export const ORDER_STATUSES = [
  { value: "new",        label: "Новый",       color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "processing", label: "В обработке", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { value: "assembled",  label: "Собран",      color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "shipped",    label: "Отправлен",   color: "bg-orange-50 text-orange-700 border-orange-200" },
  { value: "delivered",  label: "Доставлен",   color: "bg-green-50 text-green-700 border-green-200" },
  { value: "cancelled",  label: "Отменён",     color: "bg-red-50 text-red-700 border-red-200" },
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number]["value"];

export const STATUS_VALUES = ORDER_STATUSES.map((s) => s.value);

export function getStatusMeta(status: string) {
  return (
    ORDER_STATUSES.find((s) => s.value === status) ?? {
      value: status,
      label: status,
      color: "bg-brand-elevated text-brand-muted border-brand-border",
    }
  );
}

export function getPaymentStatusMeta(paymentStatus: string) {
  if (paymentStatus === "paid") {
    return {
      label: "Оплачен",
      color: "bg-green-50 text-green-700 border-green-200",
    };
  }
  if (paymentStatus === "failed") {
    return {
      label: "Оплата отклонена",
      color: "bg-red-50 text-red-700 border-red-200",
    };
  }
  if (paymentStatus === "pending") {
    return {
      label: "Ожидает оплату",
      color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    };
  }
  if (paymentStatus === "unpaid") {
    return {
      label: "Не оплачен",
      color: "bg-brand-elevated text-brand-muted border-brand-border",
    };
  }
  return {
    label: paymentStatus,
    color: "bg-brand-elevated text-brand-muted border-brand-border",
  };
}
