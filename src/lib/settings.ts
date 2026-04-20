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
