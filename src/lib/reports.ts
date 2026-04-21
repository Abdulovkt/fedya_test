import { sql } from "drizzle-orm";
import { db } from "@/db";
import { DEMAND_LIMIT_OPTIONS } from "@/lib/reports-constants";

export { DEMAND_LIMIT_OPTIONS } from "@/lib/reports-constants";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** Сегодня в локальном календаре сервера (YYYY-MM-DD). */
export function formatReportDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Нормализует дату из query или подставляет сегодня. */
export function parseReportDateOrToday(raw: string | undefined): string {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return formatReportDate(new Date());
  const [y, m, d] = raw.split("-").map(Number);
  const test = new Date(y, m - 1, d);
  if (Number.isNaN(test.getTime())) return formatReportDate(new Date());
  if (test.getFullYear() !== y || test.getMonth() !== m - 1 || test.getDate() !== d) {
    return formatReportDate(new Date());
  }
  return raw;
}

function parseYmdOrFallback(raw: string | undefined, fallback: Date): string {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return formatReportDate(fallback);
  const [y, m, d] = raw.split("-").map(Number);
  const test = new Date(y, m - 1, d);
  if (Number.isNaN(test.getTime())) return formatReportDate(fallback);
  if (test.getFullYear() !== y || test.getMonth() !== m - 1 || test.getDate() !== d) {
    return formatReportDate(fallback);
  }
  return raw;
}

function firstDayOfMonthYmd(toYmd: string): string {
  const [y, m] = toYmd.split("-").map(Number);
  return `${y}-${pad2(m)}-01`;
}

/**
 * Период отчёта: `to` по умолчанию — сегодня, `from` — 1-е число месяца даты `to`.
 * Если «с» позже «по», границы меняются местами.
 */
export function parseReportDateRange(
  fromRaw?: string,
  toRaw?: string,
): { from: string; to: string } {
  const today = new Date();
  const toYmd = parseYmdOrFallback(toRaw, today);
  const fromDefault = firstDayOfMonthYmd(toYmd);
  let fromYmd = fromRaw !== undefined ? parseYmdOrFallback(fromRaw, today) : fromDefault;

  if (fromYmd > toYmd) {
    const t = fromYmd;
    fromYmd = toYmd;
    return { from: fromYmd, to: t };
  }
  return { from: fromYmd, to: toYmd };
}

/** Начало и конец календарного дня в локальном времени сервера (мс). */
export function getDayBoundsFromYmd(ymd: string): { startMs: number; endMs: number } {
  const [y, m, d] = ymd.split("-").map(Number);
  const startMs = new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
  const endMs = new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
  return { startMs, endMs };
}

/** Границы периода: начало дня «с», конец дня «по». */
export function getRangeBoundsFromYmd(fromYmd: string, toYmd: string): { startMs: number; endMs: number } {
  const { startMs } = getDayBoundsFromYmd(fromYmd);
  const { endMs } = getDayBoundsFromYmd(toYmd);
  return { startMs, endMs };
}

export function formatReportDateLongRu(ymd: string): string {
  const { startMs } = getDayBoundsFromYmd(ymd);
  return new Date(startMs).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatReportRangeRu(fromYmd: string, toYmd: string): string {
  if (fromYmd === toYmd) {
    return formatReportDateLongRu(fromYmd);
  }
  return `с ${formatReportDateLongRu(fromYmd)} по ${formatReportDateLongRu(toYmd)}`;
}

export function formatReportGeneratedAt(d: Date): string {
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** По умолчанию 5; неизвестное значение из URL — 5. */
export function parseDemandLimit(raw: string | undefined): number {
  const n = raw !== undefined && raw !== "" ? parseInt(raw, 10) : 5;
  if (!Number.isFinite(n)) return 5;
  if (!(DEMAND_LIMIT_OPTIONS as readonly number[]).includes(n)) {
    return 5;
  }
  return n;
}

export type ProductDemandRow = {
  id: number;
  name: string;
  is_active: number;
  category_name: string;
  qty_sold: number;
  revenue_kopecks: number;
};

/** Спрос за период: оплаченные заказы, не отменённые, дата создания заказа в интервале включительно. */
export async function getProductDemandTopForRange(
  rangeStartMs: number,
  rangeEndMs: number,
  limit = 5,
): Promise<ProductDemandRow[]> {
  const rows = await db.all(sql`
    SELECT
      p.id AS id,
      p.name AS name,
      p.is_active AS is_active,
      c.name AS category_name,
      COALESCE(s.qty_sold, 0) AS qty_sold,
      COALESCE(s.revenue_kopecks, 0) AS revenue_kopecks
    FROM products p
    JOIN categories c ON c.id = p.category_id
    LEFT JOIN (
      SELECT
        oi.product_id AS product_id,
        SUM(oi.quantity) AS qty_sold,
        SUM(oi.quantity * oi.price_at_order) AS revenue_kopecks
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id
      WHERE o.payment_status = 'paid'
        AND o.status != 'cancelled'
        AND o.created_at >= ${rangeStartMs}
        AND o.created_at <= ${rangeEndMs}
      GROUP BY oi.product_id
    ) s ON s.product_id = p.id
    ORDER BY qty_sold DESC, p.name ASC
    LIMIT ${limit}
  `);
  return rows as ProductDemandRow[];
}

export async function getProductDemandBottomForRange(
  rangeStartMs: number,
  rangeEndMs: number,
  limit = 5,
): Promise<ProductDemandRow[]> {
  const rows = await db.all(sql`
    SELECT
      p.id AS id,
      p.name AS name,
      p.is_active AS is_active,
      c.name AS category_name,
      COALESCE(s.qty_sold, 0) AS qty_sold,
      COALESCE(s.revenue_kopecks, 0) AS revenue_kopecks
    FROM products p
    JOIN categories c ON c.id = p.category_id
    LEFT JOIN (
      SELECT
        oi.product_id AS product_id,
        SUM(oi.quantity) AS qty_sold,
        SUM(oi.quantity * oi.price_at_order) AS revenue_kopecks
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id
      WHERE o.payment_status = 'paid'
        AND o.status != 'cancelled'
        AND o.created_at >= ${rangeStartMs}
        AND o.created_at <= ${rangeEndMs}
      GROUP BY oi.product_id
    ) s ON s.product_id = p.id
    ORDER BY qty_sold ASC, p.name ASC
    LIMIT ${limit}
  `);
  return rows as ProductDemandRow[];
}

export type StockRow = {
  id: number;
  name: string;
  is_active: number;
  category_name: string;
  stock: number;
};

export async function getStockReport(): Promise<StockRow[]> {
  const rows = await db.all(sql`
    SELECT
      p.id AS id,
      p.name AS name,
      p.is_active AS is_active,
      c.name AS category_name,
      p.stock AS stock
    FROM products p
    JOIN categories c ON c.id = p.category_id
    ORDER BY p.stock ASC, c.name ASC, p.name ASC
  `);
  return rows as StockRow[];
}

export type CustomerRow = {
  email_key: string;
  phone: string;
  customer_name: string;
  orders_count: number;
  total_spent_kopecks: number;
  first_order_at: number;
  last_order_at: number;
};

export type CustomerSummary = {
  totalCustomers: number;
  newSingleOrder: number;
  repeatCustomers: number;
};

/** Клиенты по оплаченным заказам с датой создания в периоде включительно (сегментация по заказам в периоде). */
export async function getCustomerReportForRange(
  rangeStartMs: number,
  rangeEndMs: number,
): Promise<{
  rows: CustomerRow[];
  summary: CustomerSummary;
}> {
  const rows = await db.all(sql`
    SELECT
      lower(trim(email)) AS email_key,
      max(phone) AS phone,
      max(customer_name) AS customer_name,
      count(*) AS orders_count,
      sum(total_amount) AS total_spent_kopecks,
      min(created_at) AS first_order_at,
      max(created_at) AS last_order_at
    FROM orders
    WHERE payment_status = 'paid'
      AND status != 'cancelled'
      AND created_at >= ${rangeStartMs}
      AND created_at <= ${rangeEndMs}
    GROUP BY lower(trim(email))
    ORDER BY orders_count DESC, last_order_at DESC
  `);

  const list = rows as CustomerRow[];
  let newSingleOrder = 0;
  let repeatCustomers = 0;
  for (const r of list) {
    if (r.orders_count >= 2) repeatCustomers += 1;
    else newSingleOrder += 1;
  }
  return {
    rows: list,
    summary: {
      totalCustomers: list.length,
      newSingleOrder,
      repeatCustomers,
    },
  };
}

export type ProfitReportSummary = {
  orders_count: number;
  revenue_kopecks: number;
  cost_kopecks: number;
  profit_kopecks: number;
};

export type ProfitByProductRow = {
  product_id: number;
  name: string;
  category_name: string;
  qty_sold: number;
  revenue_kopecks: number;
  cost_kopecks: number;
  profit_kopecks: number;
};

/**
 * Валовая прибыль по оплаченным неотменённым заказам за период.
 * Себестоимость — текущая из карточки товара (коп. за ед.) × проданное количество.
 */
export async function getProfitReportForRange(
  rangeStartMs: number,
  rangeEndMs: number,
): Promise<{ summary: ProfitReportSummary; rows: ProfitByProductRow[] }> {
  const summaryRows = await db.all(sql`
    SELECT
      COUNT(DISTINCT o.id) AS orders_count,
      COALESCE(SUM(oi.quantity * oi.price_at_order), 0) AS revenue_kopecks,
      COALESCE(SUM(oi.quantity * p.cost), 0) AS cost_kopecks
    FROM order_items oi
    INNER JOIN orders o ON o.id = oi.order_id
    INNER JOIN products p ON p.id = oi.product_id
    WHERE o.payment_status = 'paid'
      AND o.status != 'cancelled'
      AND o.created_at >= ${rangeStartMs}
      AND o.created_at <= ${rangeEndMs}
  `);

  const detailRows = await db.all(sql`
    SELECT
      p.id AS product_id,
      p.name AS name,
      c.name AS category_name,
      SUM(oi.quantity) AS qty_sold,
      SUM(oi.quantity * oi.price_at_order) AS revenue_kopecks,
      SUM(oi.quantity * p.cost) AS cost_kopecks
    FROM order_items oi
    INNER JOIN orders o ON o.id = oi.order_id
    INNER JOIN products p ON p.id = oi.product_id
    INNER JOIN categories c ON c.id = p.category_id
    WHERE o.payment_status = 'paid'
      AND o.status != 'cancelled'
      AND o.created_at >= ${rangeStartMs}
      AND o.created_at <= ${rangeEndMs}
    GROUP BY p.id
    ORDER BY (SUM(oi.quantity * oi.price_at_order) - SUM(oi.quantity * p.cost)) DESC
  `);

  const raw = summaryRows[0] as
    | {
        orders_count: number;
        revenue_kopecks: number;
        cost_kopecks: number;
      }
    | undefined;

  const revenue = Number(raw?.revenue_kopecks ?? 0);
  const cost = Number(raw?.cost_kopecks ?? 0);
  const summary: ProfitReportSummary = {
    orders_count: Number(raw?.orders_count ?? 0),
    revenue_kopecks: revenue,
    cost_kopecks: cost,
    profit_kopecks: revenue - cost,
  };

  const rows: ProfitByProductRow[] = (
    detailRows as Array<{
      product_id: number;
      name: string;
      category_name: string;
      qty_sold: number;
      revenue_kopecks: number;
      cost_kopecks: number;
    }>
  ).map((r) => {
    const rev = Number(r.revenue_kopecks);
    const c = Number(r.cost_kopecks);
    return {
      product_id: Number(r.product_id),
      name: String(r.name),
      category_name: String(r.category_name),
      qty_sold: Number(r.qty_sold),
      revenue_kopecks: rev,
      cost_kopecks: c,
      profit_kopecks: rev - c,
    };
  });

  return { summary, rows };
}
