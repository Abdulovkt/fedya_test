import { formatPrice, getStockLabel } from "@/lib/format";
import type {
  CustomerRow,
  CustomerSummary,
  ProductDemandRow,
  ProfitByProductRow,
  ProfitReportSummary,
  StockRow,
} from "@/lib/reports";

export function ReportHeader({
  code,
  title,
  generatedAt,
}: {
  code: string;
  title: string;
  generatedAt: string;
}) {
  return (
    <header className="mb-6 border-b-2 border-neutral-900 pb-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">{code}</p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
            {title}
          </h1>
        </div>
        <div className="text-right text-sm text-neutral-700">
          <p className="font-medium text-neutral-900">Дата и время формирования</p>
          <p className="tabular-nums">{generatedAt}</p>
        </div>
      </div>
    </header>
  );
}

export function DemandTable({
  rows,
  emptyHint,
}: {
  rows: ProductDemandRow[];
  emptyHint: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="report-table w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="report-th">№</th>
            <th className="report-th text-left">Наименование</th>
            <th className="report-th text-left">Категория</th>
            <th className="report-th text-right">Продано, шт.</th>
            <th className="report-th text-right">Выручка</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="report-td text-center text-neutral-500">
                {emptyHint}
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={r.id}>
                <td className="report-td tabular-nums text-neutral-600">{i + 1}</td>
                <td className="report-td text-neutral-900">
                  {r.name}
                  {!r.is_active ? (
                    <span className="text-neutral-500"> (не в витрине)</span>
                  ) : null}
                </td>
                <td className="report-td text-neutral-700">{r.category_name}</td>
                <td className="report-td text-right tabular-nums text-neutral-900">
                  {r.qty_sold}
                </td>
                <td className="report-td text-right tabular-nums text-neutral-900">
                  {formatPrice(r.revenue_kopecks)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function StockTable({ rows }: { rows: StockRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="report-table w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="report-th">№</th>
            <th className="report-th text-left">Наименование</th>
            <th className="report-th text-left">Категория</th>
            <th className="report-th text-right">Остаток, шт.</th>
            <th className="report-th text-left">Примечание</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="report-td text-center text-neutral-500">
                Нет товаров в каталоге.
              </td>
            </tr>
          ) : (
            rows.map((r, i) => {
              const note = getStockLabel(r.stock);
              return (
                <tr key={r.id}>
                  <td className="report-td tabular-nums text-neutral-600">{i + 1}</td>
                  <td className="report-td text-neutral-900">
                    {r.name}
                    {!r.is_active ? (
                      <span className="text-neutral-500"> (не отображается в витрине)</span>
                    ) : null}
                  </td>
                  <td className="report-td text-neutral-700">{r.category_name}</td>
                  <td className="report-td text-right tabular-nums text-neutral-900">
                    {r.stock}
                  </td>
                  <td className="report-td text-neutral-800">{note.text}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export function CustomerSummaryTable({ summary }: { summary: CustomerSummary }) {
  return (
    <table className="report-table mb-8 w-full max-w-md border-collapse text-sm">
      <tbody>
        <tr>
          <td className="report-td w-2/3 text-neutral-700">
            Всего клиентов (уникальный e-mail)
          </td>
          <td className="report-td text-right font-medium tabular-nums text-neutral-900">
            {summary.totalCustomers}
          </td>
        </tr>
        <tr>
          <td className="report-td text-neutral-700">Новые (один оплаченный заказ)</td>
          <td className="report-td text-right font-medium tabular-nums text-neutral-900">
            {summary.newSingleOrder}
          </td>
        </tr>
        <tr>
          <td className="report-td text-neutral-700">Постоянные (два и более заказов)</td>
          <td className="report-td text-right font-medium tabular-nums text-neutral-900">
            {summary.repeatCustomers}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export function CustomerRegistryTable({ rows }: { rows: CustomerRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="report-table w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="report-th">№</th>
            <th className="report-th text-left">E-mail</th>
            <th className="report-th text-left">Имя</th>
            <th className="report-th text-left">Телефон</th>
            <th className="report-th text-left">Тип</th>
            <th className="report-th text-right">Заказов</th>
            <th className="report-th text-right">Сумма</th>
            <th className="report-th text-left">Первый заказ</th>
            <th className="report-th text-left">Последний заказ</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={9} className="report-td text-center text-neutral-500">
                Нет данных.
              </td>
            </tr>
          ) : (
            rows.map((r, i) => {
              const first = new Date(r.first_order_at);
              const last = new Date(r.last_order_at);
              const typeLabel = r.orders_count >= 2 ? "постоянный" : "новый";
              return (
                <tr key={r.email_key}>
                  <td className="report-td tabular-nums text-neutral-600">{i + 1}</td>
                  <td className="report-td max-w-[180px] break-all text-neutral-900">
                    {r.email_key}
                  </td>
                  <td className="report-td text-neutral-800">{r.customer_name}</td>
                  <td className="report-td tabular-nums text-neutral-800">{r.phone}</td>
                  <td className="report-td text-neutral-800">{typeLabel}</td>
                  <td className="report-td text-right tabular-nums text-neutral-900">
                    {r.orders_count}
                  </td>
                  <td className="report-td text-right tabular-nums text-neutral-900">
                    {formatPrice(r.total_spent_kopecks)}
                  </td>
                  <td className="report-td whitespace-nowrap text-neutral-700">
                    {first.toLocaleDateString("ru-RU")}
                  </td>
                  <td className="report-td whitespace-nowrap text-neutral-700">
                    {last.toLocaleDateString("ru-RU")}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export function ProfitSummaryTable({ summary }: { summary: ProfitReportSummary }) {
  return (
    <table className="report-table mb-8 w-full max-w-lg border-collapse text-sm">
      <tbody>
        <tr>
          <td className="report-td text-neutral-700">Заказов (уникальных) за период</td>
          <td className="report-td text-right font-medium tabular-nums text-neutral-900">
            {summary.orders_count}
          </td>
        </tr>
        <tr>
          <td className="report-td text-neutral-700">Выручка</td>
          <td className="report-td text-right font-medium tabular-nums text-neutral-900">
            {formatPrice(summary.revenue_kopecks)}
          </td>
        </tr>
        <tr>
          <td className="report-td text-neutral-700">Себестоимость проданных товаров</td>
          <td className="report-td text-right font-medium tabular-nums text-neutral-900">
            {formatPrice(summary.cost_kopecks)}
          </td>
        </tr>
        <tr>
          <td className="report-td font-semibold text-neutral-900">Валовая прибыль</td>
          <td className="report-td text-right font-semibold tabular-nums text-neutral-900">
            {formatPrice(summary.profit_kopecks)}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export function ProfitByProductTable({ rows }: { rows: ProfitByProductRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="report-table w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="report-th">№</th>
            <th className="report-th text-left">Товар</th>
            <th className="report-th text-left">Категория</th>
            <th className="report-th text-right">Продано, шт.</th>
            <th className="report-th text-right">Выручка</th>
            <th className="report-th text-right">Себестоимость</th>
            <th className="report-th text-right">Прибыль</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="report-td text-center text-neutral-500">
                Нет оплаченных продаж за период.
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={r.product_id}>
                <td className="report-td tabular-nums text-neutral-600">{i + 1}</td>
                <td className="report-td text-neutral-900">{r.name}</td>
                <td className="report-td text-neutral-700">{r.category_name}</td>
                <td className="report-td text-right tabular-nums text-neutral-900">{r.qty_sold}</td>
                <td className="report-td text-right tabular-nums text-neutral-900">
                  {formatPrice(r.revenue_kopecks)}
                </td>
                <td className="report-td text-right tabular-nums text-neutral-900">
                  {formatPrice(r.cost_kopecks)}
                </td>
                <td className="report-td text-right font-medium tabular-nums text-neutral-900">
                  {formatPrice(r.profit_kopecks)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
