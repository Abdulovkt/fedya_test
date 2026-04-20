import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";

const ORDER_NUMBER_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ORDER_NUMBER_CODE_LENGTH = 4;

function toYmd(date: Date) {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

function randomCode(length = ORDER_NUMBER_CODE_LENGTH) {
  let result = "";
  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * ORDER_NUMBER_CHARS.length);
    result += ORDER_NUMBER_CHARS[index];
  }
  return result;
}

export function formatPublicOrderNumber(date: Date = new Date()) {
  return `${toYmd(date)}-${randomCode()}`;
}

export async function generateUniquePublicOrderNumber(maxAttempts = 12) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = formatPublicOrderNumber();
    const [existing] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.publicOrderNumber, candidate))
      .limit(1);

    if (!existing) {
      return candidate;
    }
  }
  throw new Error("Failed to generate unique public order number");
}

export function getDisplayOrderNumber(order: {
  id: number;
  publicOrderNumber: string | null;
}) {
  return order.publicOrderNumber ?? `#${order.id}`;
}

export function buildPublicPayPassClientRequestId(publicOrderNumber: string) {
  return `ORDER-${publicOrderNumber}`;
}

export async function resolveOrderIdByPublicNumber(
  publicOrderNumber: string,
): Promise<number | null> {
  const [order] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.publicOrderNumber, publicOrderNumber))
    .limit(1);
  return order?.id ?? null;
}

export async function findOrderIdentity(orderRef: string) {
  const numeric = Number(orderRef);
  if (Number.isFinite(numeric)) {
    const [byId] = await db
      .select({ id: orders.id, publicOrderNumber: orders.publicOrderNumber })
      .from(orders)
      .where(eq(orders.id, numeric))
      .limit(1);
    if (byId) return byId;
  }

  const [byPublic] = await db
    .select({ id: orders.id, publicOrderNumber: orders.publicOrderNumber })
    .from(orders)
    .where(eq(orders.publicOrderNumber, orderRef))
    .limit(1);
  return byPublic ?? null;
}
