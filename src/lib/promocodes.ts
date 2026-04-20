import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  orders,
  products,
  promoCodeProducts,
  promoCodes,
  promoCodeUsages,
} from "@/db/schema";

export type PromoCodeRecord = {
  id: number;
  code: string;
  discountPercent: number;
  startsAt: Date;
  endsAt: Date;
  appliesToAll: boolean;
  isActive: boolean;
  productIds: number[];
};

export type PromoProductSummary = {
  id: number;
  name: string;
};

type PriceLine = {
  productId: number;
  price: number;
  quantity: number;
};

function mapPromoCode(
  promo: typeof promoCodes.$inferSelect,
  productIds: number[],
): PromoCodeRecord {
  return {
    id: promo.id,
    code: promo.code,
    discountPercent: promo.discountPercent,
    startsAt: promo.startsAt,
    endsAt: promo.endsAt,
    appliesToAll: promo.appliesToAll,
    isActive: promo.isActive,
    productIds,
  };
}

export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase();
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

const ADDRESS_TOKEN_ALIASES: Record<string, string> = {
  индекс: "",
  обл: "область",
  область: "область",
  край: "край",
  респ: "республика",
  республика: "республика",
  г: "город",
  гор: "город",
  город: "город",
  ул: "улица",
  улица: "улица",
  пр: "проспект",
  просп: "проспект",
  проспект: "проспект",
  пер: "переулок",
  переулок: "переулок",
  проезд: "проезд",
  ш: "шоссе",
  шоссе: "шоссе",
  д: "дом",
  дом: "дом",
  кв: "квартира",
  квартира: "квартира",
  корп: "корпус",
  корпус: "корпус",
  стр: "строение",
  строение: "строение",
  лит: "литера",
  литера: "литера",
  с: "село",
  село: "село",
  пос: "поселок",
  поселок: "поселок",
  поселокгт: "поселок",
  пгт: "поселок",
  деревня: "деревня",
  дер: "деревня",
  мкр: "микрорайон",
  микрорайон: "микрорайон",
};

export function getAddressSignature(value: string | null | undefined): string {
  const normalized = normalizeText(value)
    .replace(/ё/g, "е")
    .replace(/[.,/#!$%^&*;:{}=\-_`~()\\[\]+"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return "";
  }

  return normalized
    .split(" ")
    .map((token) => ADDRESS_TOKEN_ALIASES[token] ?? token)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "ru"))
    .join(" ");
}

async function getPromoProductIds(promoCodeId: number): Promise<number[]> {
  const rows = await db
    .select({ productId: promoCodeProducts.productId })
    .from(promoCodeProducts)
    .where(eq(promoCodeProducts.promoCodeId, promoCodeId));

  return rows.map((row) => row.productId);
}

export async function getPromoCodeById(id: number): Promise<PromoCodeRecord | null> {
  const [promo] = await db.select().from(promoCodes).where(eq(promoCodes.id, id)).limit(1);
  if (!promo) {
    return null;
  }

  return mapPromoCode(promo, await getPromoProductIds(promo.id));
}

export async function getPromoCodeByCode(code: string): Promise<PromoCodeRecord | null> {
  const normalizedCode = normalizePromoCode(code);
  const [promo] = await db
    .select()
    .from(promoCodes)
    .where(eq(promoCodes.code, normalizedCode))
    .limit(1);

  if (!promo) {
    return null;
  }

  return mapPromoCode(promo, await getPromoProductIds(promo.id));
}

export async function hasPromoBeenUsedByEmail(
  promoCodeId: number,
  email: string,
): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return false;
  }

  const [usage] = await db
    .select({ id: promoCodeUsages.id })
    .from(promoCodeUsages)
    .where(
      and(
        eq(promoCodeUsages.promoCodeId, promoCodeId),
        eq(promoCodeUsages.email, normalizedEmail),
      ),
    )
    .limit(1);

  return Boolean(usage);
}

export async function hasPromoBeenUsedByCustomer(
  promoCodeId: number,
  customer: {
    email: string;
    customerName: string;
    address?: string | null;
  },
): Promise<boolean> {
  const normalizedEmail = normalizeText(customer.email);
  const normalizedName = normalizeText(customer.customerName);
  const normalizedAddress = getAddressSignature(customer.address);

  const usages = await db
    .select({
      email: promoCodeUsages.email,
      customerName: orders.customerName,
      address: orders.address,
    })
    .from(promoCodeUsages)
    .innerJoin(orders, eq(promoCodeUsages.orderId, orders.id))
    .where(eq(promoCodeUsages.promoCodeId, promoCodeId));

  return usages.some((usage) => {
    const usedEmail = normalizeText(usage.email);
    if (normalizedEmail && usedEmail === normalizedEmail) {
      return true;
    }

    const usedName = normalizeText(usage.customerName);
    const usedAddress = getAddressSignature(usage.address);

    return Boolean(
      normalizedName &&
        normalizedAddress &&
        usedName === normalizedName &&
        usedAddress === normalizedAddress,
    );
  });
}

export function isPromoCodeActive(promo: PromoCodeRecord, now = new Date()): boolean {
  if (!promo.isActive) {
    return false;
  }

  return promo.startsAt <= now && promo.endsAt >= now;
}

export function isPromoApplicableToLines(
  lines: PriceLine[],
  promo: PromoCodeRecord,
): boolean {
  if (promo.appliesToAll) {
    return lines.length > 0;
  }

  return lines.some((line) => promo.productIds.includes(line.productId));
}

export function getPromoValidationError(
  lines: PriceLine[],
  promo: PromoCodeRecord | null,
): string | null {
  if (!promo) {
    return "Промокод не найден";
  }

  if (!promo.isActive) {
    return "Промокод отключён";
  }

  const now = new Date();
  if (promo.startsAt > now) {
    return "Промокод ещё не активен";
  }

  if (promo.endsAt < now) {
    return "Срок действия промокода истёк";
  }

  if (!isPromoApplicableToLines(lines, promo)) {
    return "Промокод не подходит для товаров в корзине";
  }

  return null;
}

export async function getPromoProducts(
  promo: PromoCodeRecord,
): Promise<PromoProductSummary[]> {
  if (promo.appliesToAll || promo.productIds.length === 0) {
    return [];
  }

  return db
    .select({
      id: products.id,
      name: products.name,
    })
    .from(products)
    .where(inArray(products.id, promo.productIds));
}

export async function getPromoRecipients(): Promise<Array<{ email: string; customerName: string }>> {
  const rows = await db
    .select({
      email: orders.email,
      customerName: orders.customerName,
    })
    .from(orders);

  const uniqueRecipients = new Map<string, { email: string; customerName: string }>();

  for (const row of rows) {
    const normalizedEmail = row.email.trim().toLowerCase();
    if (!normalizedEmail || uniqueRecipients.has(normalizedEmail)) {
      continue;
    }

    uniqueRecipients.set(normalizedEmail, {
      email: normalizedEmail,
      customerName: row.customerName.trim() || "Покупатель",
    });
  }

  return [...uniqueRecipients.values()];
}
