export const FULFILLMENT_TYPES = ["russian_post", "cdek"] as const;
export type FulfillmentType = (typeof FULFILLMENT_TYPES)[number];

export function normalizeFulfillmentType(raw: string | null | undefined): FulfillmentType {
  if (raw === "cdek") return "cdek";
  return "russian_post";
}

export function fulfillmentLabel(t: FulfillmentType): string {
  switch (t) {
    case "cdek":
      return "СДЭК";
    default:
      return "Почта России";
  }
}

export function fulfillmentShortHint(t: FulfillmentType): string {
  switch (t) {
    case "cdek":
      return "Отправка СДЭК — получение в пункте выдачи.";
    default:
      return "Отправка Почтой России.";
  }
}

export type LineWithFulfillment = { fulfillmentType: FulfillmentType };

export function getDeliveryBreakdown(
  lines: LineWithFulfillment[],
  fees: { postKopecks: number; cdekKopecks: number },
) {
  const hasPost = lines.some((l) => l.fulfillmentType === "russian_post");
  const hasCdek = lines.some((l) => l.fulfillmentType === "cdek");
  const postKopecks = hasPost ? Math.max(0, fees.postKopecks) : 0;
  const cdekKopecks = hasCdek ? Math.max(0, fees.cdekKopecks) : 0;
  return {
    hasPost,
    hasCdek,
    postKopecks,
    cdekKopecks,
    totalDeliveryKopecks: postKopecks + cdekKopecks,
  };
}
