import {
  CustomerRegistryTable,
  CustomerSummaryTable,
  ReportHeader,
} from "@/components/admin/ReportBlocks";
import { SingleReportToolbar } from "@/components/admin/SingleReportToolbar";
import {
  formatReportGeneratedAt,
  formatReportRangeRu,
  getCustomerReportForRange,
  getRangeBoundsFromYmd,
  parseReportDateRange,
} from "@/lib/reports";

export const metadata = { title: "Отчёт по клиентам" };

type SearchParams = Promise<{ from?: string; to?: string }>;

export default async function ReportCustomersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { from: fromRaw, to: toRaw } = await searchParams;
  const { from, to } = parseReportDateRange(fromRaw, toRaw);
  const { startMs, endMs } = getRangeBoundsFromYmd(from, to);

  const customerData = await getCustomerReportForRange(startMs, endMs);

  const generatedAt = formatReportGeneratedAt(new Date());
  const rangeTitle = formatReportRangeRu(from, to);

  return (
    <div className="admin-report max-w-4xl">
      <SingleReportToolbar
        reportPath="/admin/reports/customers"
        fromValue={from}
        toValue={to}
      />

      <p className="print:hidden mb-6 text-sm text-brand-muted">
        Период: <strong>{rangeTitle}</strong>. Учитываются только оплаченные неотменённые заказы,
        созданные в этот период. Клиент определяется по e-mail; тип — по числу таких заказов в
        периоде.
      </p>

      <article className="admin-report-sheet border border-neutral-300 bg-white p-8 text-neutral-900 shadow-sm print:shadow-none">
        <ReportHeader
          code="ОП-КЛ-01"
          title="Отчёт по клиентам (оплаченные заказы)"
          generatedAt={generatedAt}
        />
        <p className="mb-2 text-sm font-medium text-neutral-900">Период: {rangeTitle}</p>
        <p className="mb-6 border-b border-neutral-200 pb-4 text-sm leading-relaxed text-neutral-700">
          <strong>Новый</strong> — один учтённый заказ в периоде; <strong>постоянный</strong> — два и
          более заказов в периоде.
        </p>

        <h3 className="mb-3 text-center text-sm font-semibold uppercase tracking-wide text-neutral-800">
          Сводка
        </h3>
        <CustomerSummaryTable summary={customerData.summary} />

        <h3 className="mb-3 text-center text-sm font-semibold uppercase tracking-wide text-neutral-800">
          Таблица 1. Реестр клиентов
        </h3>
        <CustomerRegistryTable rows={customerData.rows} />
      </article>
    </div>
  );
}
