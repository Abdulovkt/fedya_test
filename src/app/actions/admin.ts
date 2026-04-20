"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  categories,
  chatMessages,
  orders,
  products,
  promoCodeProducts,
  promoCodes,
} from "@/db/schema";
import { slugify } from "@/lib/format";
import { saveSettings, type SettingKey, SETTING_KEYS } from "@/lib/settings";
import { STATUS_VALUES, getStatusMeta } from "@/lib/order-statuses";
import {
  sendOrderStatusEmail,
  sendPromoCodeAnnouncementEmail,
  verifyEmailTransport,
} from "@/lib/email";
import {
  getPromoProducts,
  getPromoRecipients,
  normalizePromoCode,
  type PromoCodeRecord,
} from "@/lib/promocodes";
import { syncOrderPaymentStatusById } from "@/lib/paypass-sync";
import { getDisplayOrderNumber } from "@/lib/order-number";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session;
}

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  sortOrder: z.coerce.number().int().default(0),
});

export async function createCategory(formData: FormData) {
  await requireAdmin();
  const raw = {
    name: String(formData.get("name") ?? ""),
    slug: formData.get("slug")?.toString(),
    sortOrder: formData.get("sortOrder"),
  };
  const parsed = categorySchema.safeParse(raw);
  if (!parsed.success) return;
  const slug = parsed.data.slug?.trim() || slugify(parsed.data.name);
  await db.insert(categories).values({
    name: parsed.data.name.trim(),
    slug,
    sortOrder: parsed.data.sortOrder,
  });
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

const productSchema = z.object({
  categoryId: z.coerce.number().int().positive(),
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  priceRub: z.coerce.number().positive(),
  stock: z.coerce.number().int().min(0),
});

async function saveUploadedImage(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (!file.type.startsWith("image/")) return null;
  if (file.size > 4 * 1024 * 1024) return null;
  const ext = path.extname(file.name) || ".jpg";
  const name = `${crypto.randomUUID()}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, name), buf);
  return `/uploads/${name}`;
}

export async function createProduct(formData: FormData) {
  await requireAdmin();
  const file = formData.get("image") as File | null;
  const parsed = productSchema.safeParse({
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    slug: formData.get("slug")?.toString(),
    description: formData.get("description")?.toString(),
    priceRub: formData.get("priceRub"),
    stock: formData.get("stock"),
  });
  if (!parsed.success) return;

  const isActive = formData.get("isActive") === "on";
  const slug =
    parsed.data.slug?.trim() || slugify(parsed.data.name);
  const imageUrl = await saveUploadedImage(file);

  await db.insert(products).values({
    categoryId: parsed.data.categoryId,
    name: parsed.data.name.trim(),
    slug,
    description: parsed.data.description?.trim() || null,
    price: Math.round(parsed.data.priceRub * 100),
    imageUrl,
    stock: parsed.data.stock,
    isActive,
  });
  revalidatePath("/admin/products");
  revalidatePath("/catalog");
  revalidatePath("/");
}

export type UpdateProductState = { ok?: boolean; error?: string } | null;

export async function updateProduct(
  _prev: UpdateProductState,
  formData: FormData,
): Promise<UpdateProductState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return { error: "Неверный ID товара" };
  const file = formData.get("image") as File | null;
  const parsed = productSchema.safeParse({
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    slug: formData.get("slug")?.toString(),
    description: formData.get("description")?.toString(),
    priceRub: formData.get("priceRub"),
    stock: formData.get("stock"),
  });
  if (!parsed.success) return { error: "Проверьте правильность заполнения полей" };

  const isActive = formData.get("isActive") === "on";
  const imageUrl = await saveUploadedImage(file);
  const slug = parsed.data.slug?.trim() || slugify(parsed.data.name);

  await db
    .update(products)
    .set({
      categoryId: parsed.data.categoryId,
      name: parsed.data.name.trim(),
      slug,
      description: parsed.data.description?.trim() || null,
      price: Math.round(parsed.data.priceRub * 100),
      ...(imageUrl ? { imageUrl } : {}),
      stock: parsed.data.stock,
      isActive,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id));

  revalidatePath("/admin/products");
  revalidatePath("/catalog");
  revalidatePath("/");
  revalidatePath(`/product/${slug}`);
  return { ok: true };
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/admin/products");
  revalidatePath("/catalog");
}

const promoCodeSchema = z.object({
  code: z.string().min(3, "Укажите код промокода"),
  discountPercent: z.coerce.number().int().min(1, "Минимум 1%").max(90, "Максимум 90%"),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  appliesToAll: z.boolean(),
  productIds: z.array(z.coerce.number().int().positive()),
});

export type CreatePromoCodeState =
  | {
      ok?: boolean;
      error?: string;
    }
  | null;

async function sendPromoCodeNotifications(promo: PromoCodeRecord) {
  const recipients = await getPromoRecipients();
  if (!recipients.length) {
    return;
  }

  const promoProducts = await getPromoProducts(promo);
  const productNames = promoProducts.map((product) => product.name);

  await Promise.allSettled(
    recipients.map((recipient) =>
      sendPromoCodeAnnouncementEmail({
        to: recipient.email,
        customerName: recipient.customerName,
        code: promo.code,
        discountPercent: promo.discountPercent,
        startsAt: promo.startsAt,
        endsAt: promo.endsAt,
        productNames,
        appliesToAll: promo.appliesToAll,
      }),
    ),
  );
}

export async function createPromoCode(
  _prev: CreatePromoCodeState,
  formData: FormData,
): Promise<CreatePromoCodeState> {
  await requireAdmin();

  const parsed = promoCodeSchema.safeParse({
    code: normalizePromoCode(String(formData.get("code") ?? "")),
    discountPercent: formData.get("discountPercent"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    appliesToAll: formData.get("appliesToAll") === "on",
    productIds: formData.getAll("productIds"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте форму промокода" };
  }

  if (parsed.data.endsAt <= parsed.data.startsAt) {
    return { error: "Дата окончания должна быть позже даты начала" };
  }

  if (!parsed.data.appliesToAll && parsed.data.productIds.length === 0) {
    return { error: "Выберите хотя бы один товар для промокода" };
  }

  const uniqueProductIds = [...new Set(parsed.data.productIds)];

  let promo: typeof promoCodes.$inferSelect | undefined;
  try {
    [promo] = await db
      .insert(promoCodes)
      .values({
        code: parsed.data.code,
        discountPercent: parsed.data.discountPercent,
        startsAt: parsed.data.startsAt,
        endsAt: parsed.data.endsAt,
        appliesToAll: parsed.data.appliesToAll,
        isActive: true,
      })
      .returning();
  } catch {
    return { error: "Не удалось создать промокод. Возможно, такой код уже существует" };
  }

  if (!promo) {
    return { error: "Не удалось создать промокод" };
  }

  if (!parsed.data.appliesToAll) {
    await db.insert(promoCodeProducts).values(
      uniqueProductIds.map((productId) => ({
        promoCodeId: promo.id,
        productId,
      })),
    );
  }

  const promoRecord: PromoCodeRecord = {
    id: promo.id,
    code: promo.code,
    discountPercent: promo.discountPercent,
    startsAt: promo.startsAt,
    endsAt: promo.endsAt,
    appliesToAll: promo.appliesToAll,
    isActive: promo.isActive,
    productIds: parsed.data.appliesToAll ? [] : uniqueProductIds,
  };

  sendPromoCodeNotifications(promoRecord).catch(() => {});

  revalidatePath("/admin/promocodes");
  revalidatePath("/cart");
  revalidatePath("/checkout");

  return { ok: true };
}

export async function deletePromoCode(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) {
    return;
  }

  await db.delete(promoCodes).where(eq(promoCodes.id, id));

  revalidatePath("/admin/promocodes");
  revalidatePath("/cart");
  revalidatePath("/checkout");
}

export type SaveSettingsState = { ok?: boolean; error?: string } | null;

export async function saveEmailSettings(
  _prev: SaveSettingsState,
  formData: FormData,
): Promise<SaveSettingsState> {
  await requireAdmin();
  try {
    const data = Object.fromEntries(
      SETTING_KEYS.map((k) => [k, (formData.get(k) as string | null) ?? ""]),
    ) as Record<SettingKey, string>;
    await saveSettings(data);
    const verifyResult = await verifyEmailTransport();
    revalidatePath("/admin/settings");
    if (!verifyResult.ok) {
      return { error: `Настройки сохранены, но SMTP недоступен: ${verifyResult.error}` };
    }
    return { ok: true };
  } catch {
    return { error: "Не удалось сохранить настройки" };
  }
}

export async function markChatAsRead(orderId: number) {
  await requireAdmin();
  await db
    .update(orders)
    .set({ adminLastReadAt: Date.now() })
    .where(eq(orders.id, orderId));
}

export async function updateOrderStatus(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("orderId"));
  const status = String(formData.get("status") ?? "");
  const message = formData.get("message")?.toString().trim() || "";
  if (!Number.isFinite(id)) return;
  if (!(STATUS_VALUES as readonly string[]).includes(status)) return;

  // Fetch order before update to get customer details and skip if status unchanged
  const [order] = await db
    .select({
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      email: orders.email,
      customerName: orders.customerName,
      chatToken: orders.chatToken,
      publicOrderNumber: orders.publicOrderNumber,
    })
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  if (!order || order.status === status) return;

  if (status === "new" && order.paymentStatus === "paid") {
    return;
  }

  await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, id));

  if (message) {
    const statusMeta = getStatusMeta(status);
    const chatMessageText = `Статус заказа изменён на «${statusMeta.label}».\n${message}`;
    await db.insert(chatMessages).values({
      orderId: id,
      sender: "admin",
      text: chatMessageText,
    });
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/chats");
  revalidatePath(`/admin/chats/${id}`);

  // Send notification email to customer (non-blocking)
  if (order.chatToken) {
    sendOrderStatusEmail({
      to: order.email,
      customerName: order.customerName,
      orderId: id,
      orderNumber: getDisplayOrderNumber({ id, publicOrderNumber: order.publicOrderNumber }),
      orderRef: order.publicOrderNumber ?? String(id),
      chatToken: order.chatToken,
      status,
      message: message || undefined,
    }).catch(() => {});
  }
}

function revalidateOrderPaymentViews(orderId: number) {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/checkout/success");
}

export async function syncOrderPaymentStatus(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("orderId"));
  if (!Number.isFinite(id)) return;

  await syncOrderPaymentStatusById(id);
  revalidateOrderPaymentViews(id);
}

export async function syncOrderPaymentStatusForOrder(orderId: number) {
  await requireAdmin();
  if (!Number.isFinite(orderId)) return;

  await syncOrderPaymentStatusById(orderId);
  revalidateOrderPaymentViews(orderId);
}
