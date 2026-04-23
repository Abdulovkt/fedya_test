/** Мин. длина текста про ПВЗ: полный адрес (город, улица, дом) или полный код/название офиса из cdek.ru. */
export const CDEK_PVZ_TEXT_MIN_LENGTH = 20;

/** Мин. длина строки адреса Почты (индекс + город + улица + дом), как в примере. */
export const RUSSIAN_POST_ADDRESS_MIN_LEN = 20;

/**
 * Плейсхолдер: «630000 Новосибирск ул. Ленина д. 10» — индекс, город, улица, дом одной строкой.
 * Возвращает текст ошибки или null, если формат подходит.
 */
export function getRussianPostAddressFormatError(text: string): string | null {
  const t = text.trim();
  if (t.length < RUSSIAN_POST_ADDRESS_MIN_LEN) {
    return `Слишком кратко — укажите полный адрес, как в примере: не меньше ${RUSSIAN_POST_ADDRESS_MIN_LEN} символов, с индексом, улицей (ул. …) и домом (д. …).`;
  }
  if (!/^\d{6}[\s,]+/u.test(t)) {
    return "Адрес для Почты России должен начинаться с 6-значного индекса, как в примере: 630000 Новосибирск …";
  }
  if (
    !/(?:^|[^\d])(?:ул\.?|улица|пр-кт|просп|переул|б-р|бульв|ш\.|шоссе|наб\.?|пл\.?)\b/iu.test(t)
  ) {
    return "Укажите улицу в формате, как в примере: «ул. Ленина» или «улица …» (без этого отправление не оформить).";
  }
  if (!/(?:\bд\.?|\bдом)\s*[\d]{1,4}/iu.test(t) && !/[^\d]д[.,\s]+[\d]{1,4}/iu.test(t)) {
    return "Укажите номер дома, как в примере: «д. 10» или «д.12» (отдельно от индекса).";
  }
  return null;
}

/**
 * Плейсхолдер: «Новосибирск, ул. Ленина, д. 12, к. 2, ПВЗ СДЭК, код NSK12».
 * Проверка после trim и минимальной длины (см. CDEK_PVZ_TEXT_MIN_LENGTH).
 */
export function getCdekPvzTextFormatError(text: string): string | null {
  const t = text.trim();
  if (t.length < CDEK_PVZ_TEXT_MIN_LENGTH) {
    return `Слишком кратко — нужен полный адрес ПВЗ, как в примере (не меньше ${CDEK_PVZ_TEXT_MIN_LENGTH} символов, с улицей и домом).`;
  }
  if (!/(?:ул\.?|улица|пр-кт|просп|переул|б-р|бульв|ш\.|шоссе|наб\.?|пл\.?)/iu.test(t)) {
    return "Скопируйте в строку улицу, как в примере: «ул. Ленина» или аналог из карточки ПВЗ на cdek.ru.";
  }
  if (!/(?:(?:\bд\.?|\bдом)\s*[\d]{1,4}|,?\s*д[.\s]*\s*[\d]{1,4})/iu.test(t)) {
    return "Укажите номер дома, как в примере: «д. 12» — из карточки пункта на cdek.ru.";
  }
  return null;
}

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
      return "Отправка СДЭК — получение в ПВЗ; доставку оплачивает покупатель отдельно (не в счёте магазина).";
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
