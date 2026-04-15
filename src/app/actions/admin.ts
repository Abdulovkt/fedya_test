"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { categories, orders, products } from "@/db/schema";
import { slugify } from "@/lib/format";
import { saveSettings, type SettingKey, SETTING_KEYS } from "@/lib/settings";
import { STATUS_VALUES } from "@/lib/order-statuses";
import { sendOrderStatusEmail, verifyEmailTransport } from "@/lib/email";

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
  if (!Number.isFinite(id)) return;
  if (!(STATUS_VALUES as readonly string[]).includes(status)) return;

  // Fetch order before update to get customer details and skip if status unchanged
  const [order] = await db
    .select({
      status: orders.status,
      email: orders.email,
      customerName: orders.customerName,
      chatToken: orders.chatToken,
    })
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  if (!order || order.status === status) return;

  await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, id));

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);

  // Send notification email to customer (non-blocking)
  if (order.chatToken) {
    const message = formData.get("message")?.toString().trim() || undefined;
    sendOrderStatusEmail({
      to: order.email,
      customerName: order.customerName,
      orderId: id,
      chatToken: order.chatToken,
      status,
      message,
    }).catch(() => {});
  }
}
