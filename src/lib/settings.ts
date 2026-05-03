import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";

export const SETTING_KEYS = [
  "smtp_host",
  "smtp_port",
  "smtp_secure",
  "smtp_user",
  "smtp_pass",
  "smtp_from",
  "site_url",
  "telegram_url",
  "paypass_api_base_url",
  "paypass_api_key",
  "paypass_sync_secret",
  /** Фикс. доставка почтой России за заказ, ₽ (строка для формы). */
  "delivery_russian_post_rub",
  /** Мин. полных суток после доставки, чтобы оставить отзыв о товаре (0 — сразу). */
  "review_product_min_days_after_delivered",
  /** Получатель для перевода на карту (как в банке). */
  "bank_transfer_recipient_name",
  /** Номер карты для перевода (без пробелов или с — как удобно клиенту). */
  "bank_transfer_card_number",
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

export type EmailSettings = Record<SettingKey, string>;

export async function getSettings(): Promise<EmailSettings> {
  const rows = await db
    .select()
    .from(settings)
    .where(inArray(settings.key, [...SETTING_KEYS]));

  const map = Object.fromEntries(rows.map((r) => [r.key, r.value])) as Partial<EmailSettings>;

  return {
    smtp_host: map.smtp_host ?? process.env.SMTP_HOST ?? "smtp.gmail.com",
    smtp_port: map.smtp_port ?? process.env.SMTP_PORT ?? "587",
    smtp_secure: map.smtp_secure ?? process.env.SMTP_SECURE ?? "false",
    smtp_user: map.smtp_user ?? process.env.SMTP_USER ?? "",
    smtp_pass: map.smtp_pass ?? process.env.SMTP_PASS ?? "",
    smtp_from: map.smtp_from ?? process.env.SMTP_FROM ?? "",
    site_url: map.site_url ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    telegram_url: map.telegram_url ?? process.env.NEXT_PUBLIC_TELEGRAM_URL ?? "",
    paypass_api_base_url:
      map.paypass_api_base_url ?? process.env.PAYPASS_API_BASE_URL ?? "https://paypass.online/api/merch",
    paypass_api_key: map.paypass_api_key ?? process.env.PAYPASS_API_KEY ?? "",
    paypass_sync_secret: map.paypass_sync_secret ?? process.env.PAYPASS_SYNC_SECRET ?? "",
    delivery_russian_post_rub: map.delivery_russian_post_rub ?? "0",
    review_product_min_days_after_delivered: map.review_product_min_days_after_delivered ?? "0",
    bank_transfer_recipient_name: map.bank_transfer_recipient_name ?? "",
    bank_transfer_card_number: map.bank_transfer_card_number ?? "",
  };
}

export function isBankTransferConfigured(s: EmailSettings): boolean {
  return Boolean(
    s.bank_transfer_recipient_name?.trim() && s.bank_transfer_card_number?.trim(),
  );
}

export function isPaypassConfigured(s: EmailSettings): boolean {
  return Boolean(s.paypass_api_key?.trim());
}

/** Парсинг сумм доставки из настроек (копейки). */
export function getDeliveryFeesKopecksFromSettings(s: EmailSettings): {
  postKopecks: number;
  cdekKopecks: number;
} {
  const postRub = Number(String(s.delivery_russian_post_rub ?? "0").replace(",", "."));
  const safePost = Number.isFinite(postRub) && postRub >= 0 ? postRub : 0;
  return {
    postKopecks: Math.round(safePost * 100),
    /** СДЭК не фиксируем в магазине: оплата доставки — у покупателя / по тарифам СДЭК. */
    cdekKopecks: 0,
  };
}

export async function saveSettings(data: Partial<EmailSettings>) {
  const entries = Object.entries(data).filter(([k]) =>
    SETTING_KEYS.includes(k as SettingKey),
  ) as [SettingKey, string][];

  for (const [key, value] of entries) {
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } });
  }
}
