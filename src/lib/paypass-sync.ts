import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import {
  createPayPassRequest,
  getPayPassRequest,
  mapPayPassStatusToLocal,
} from "@/lib/paypass";

const PAYPASS_TTL_MS = 48 * 60 * 60 * 1000;
const CANCELLABLE_ORDER_STATUSES = new Set(["new", "processing", "assembled"]);

export type SyncOrderPaymentResult = {
  orderId: number;
  updated: boolean;
  skipped: boolean;
  reason?: string;
};

function parsePayPassDate(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  // API returns "YYYY-MM-DD HH:mm:ss". Convert to ISO-like format for JS Date parser.
  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const d = new Date(normalized);
  return Number.isFinite(d.getTime()) ? d : null;
}

function toMinorUnits(amountRub: number | null): number | null {
  if (amountRub === null) return null;
  return Math.round(amountRub * 100);
}

function isExpired(createdAt: Date | null, nowMs: number) {
  if (!createdAt) return false;
  return nowMs - createdAt.getTime() > PAYPASS_TTL_MS;
}

export async function syncOrderPaymentStatusById(orderId: number): Promise<SyncOrderPaymentResult> {
  const [order] = await db
    .select({
      id: orders.id,
      createdAt: orders.createdAt,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      paypassPublicId: orders.paypassPublicId,
      paypassClientRequestId: orders.paypassClientRequestId,
      totalAmount: orders.totalAmount,
      customerName: orders.customerName,
      phone: orders.phone,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) {
    return { orderId, updated: false, skipped: true, reason: "order_not_found" };
  }

  if (order.paymentStatus === "paid" || order.paymentStatus === "failed") {
    return { orderId, updated: false, skipped: true, reason: "already_final" };
  }

  const now = Date.now();
  if (isExpired(order.createdAt, now)) {
    const nextOrderStatus = CANCELLABLE_ORDER_STATUSES.has(order.status)
      ? "cancelled"
      : order.status;
    await db
      .update(orders)
      .set({
        paymentStatus: "failed",
        paymentFailureReason: "expired_by_ttl",
        status: nextOrderStatus,
        paypassLastCheckedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));
    return { orderId, updated: true, skipped: false, reason: "expired_by_ttl" };
  }

  const lookup = order.paypassPublicId
    ? { publicId: order.paypassPublicId }
    : order.paypassClientRequestId
      ? { clientRequestId: order.paypassClientRequestId }
      : null;

  if (!lookup) {
    if (order.paymentStatus === "unpaid") {
      const clientRequestId = `ORDER-${order.id}`;
      try {
        const created = await createPayPassRequest({
          amountRub: order.totalAmount / 100,
          clientRequestId,
          comment: `Заказ #${order.id}`,
          clientFio: order.customerName,
          clientPhone: order.phone,
        });
        await db
          .update(orders)
          .set({
            paymentStatus: "pending",
            paymentFailureReason: null,
            paypassPublicId: created.publicId,
            paypassClientRequestId: clientRequestId,
            paypassTelegramLink: created.telegramLink,
            paypassStatus: created.status,
            paypassLastCheckedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(orders.id, orderId));
        return { orderId, updated: true, skipped: false, reason: "paypass_created_late" };
      } catch (error) {
        return {
          orderId,
          updated: false,
          skipped: true,
          reason: error instanceof Error ? error.message : "create_request_failed",
        };
      }
    }
    return { orderId, updated: false, skipped: true, reason: "missing_paypass_id" };
  }

  try {
    const remote = await getPayPassRequest(lookup);
    const localStatus = mapPayPassStatusToLocal(remote.status);
    const nextOrderStatus =
      localStatus === "failed" && CANCELLABLE_ORDER_STATUSES.has(order.status)
        ? "cancelled"
        : order.status;

    await db
      .update(orders)
      .set({
        paymentStatus: localStatus,
        paymentFailureReason:
          localStatus === "failed" ? `paypass_status_${remote.status}` : null,
        paypassStatus: remote.status,
        paypassPublicId: remote.publicId ?? order.paypassPublicId,
        paypassClientRequestId: remote.clientRequestId ?? order.paypassClientRequestId,
        paypassLastCheckedAt: new Date(),
        paidAmount: localStatus === "paid" ? toMinorUnits(remote.realAmountRub) : null,
        paidAt:
          localStatus === "paid"
            ? (parsePayPassDate(remote.updatedAtRaw) ?? new Date())
            : null,
        status: nextOrderStatus,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));
    return { orderId, updated: true, skipped: false };
  } catch (error) {
    return {
      orderId,
      updated: false,
      skipped: true,
      reason: error instanceof Error ? error.message : "unknown_error",
    };
  }
}

export async function syncPendingOrderPayments(limit = 50) {
  const normalizedLimit = Math.max(1, Math.min(200, Math.trunc(limit)));
  const pendingOrders = await db
    .select({ id: orders.id })
    .from(orders)
    .where(
      and(
        inArray(orders.paymentStatus, ["pending", "unpaid"]),
        inArray(orders.status, ["new", "processing", "assembled", "cancelled"]),
      ),
    )
    .orderBy(asc(orders.createdAt))
    .limit(normalizedLimit);

  const results: SyncOrderPaymentResult[] = [];
  for (const row of pendingOrders) {
    results.push(await syncOrderPaymentStatusById(row.id));
  }

  const updated = results.filter((r) => r.updated).length;
  const skipped = results.filter((r) => r.skipped).length;
  return {
    scanned: pendingOrders.length,
    updated,
    skipped,
    results,
  };
}
