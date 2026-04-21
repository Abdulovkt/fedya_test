import {
  ProfitByProductTable,
  ProfitSummaryTable,
  ReportHeader,
} from "@/components/admin/ReportBlocks";
import { SingleReportToolbar } from "@/components/admin/SingleReportToolbar";
import {
  formatReportGeneratedAt,
  formatReportRangeRu,
  getProfitReportForRange,
  getRangeBoundsFromYmd,
  parseReportDateRange,
} from "@/lib/reports";

export const metadata = { title: "Отчёт о прибыли" };

type SearchParams = Promise<{ from?: string; to?: string }>;

export default async function ReportProfitPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { from: fromRaw, to: toRaw } = await searchParams;
  const { from, to } = parseReportDateRange(fromRaw, toRaw);
  const { startMs, endMs } = getRangeBoundsFromYmd(from, to);

  const { summary, rows } = await getProfitReportForRange(startMs, endMs);

  const generatedAt = formatReportGeneratedAt(new Date());
  const rangeTitle = formatReportRangeRu(from, to);

  return (
    <div className="admin-report max-w-4xl">
      <SingleReportToolbar reportPath="/admin/reports/profit" fromValue={from} toValue={to} />

      <p className="print:hidden mb-6 text-sm text-brand-muted">
        Валовая прибыль = выручка по оплаченным заказам минус себестоимость (
        <strong>текущее</strong> поле «Себестоимость за ед.» в карточке товара × проданное
        количество). Без учёта налогов, доставки и комиссий.
      </p>

      <article className="admin-report-sheet border border-neutral-300 bg-white p-8 text-neutral-900 shadow-sm print:shadow-none">
        <ReportHeader
          code="ОП-ПР-01"
          title="Отчёт о валовой прибыли"
          generatedAt={generatedAt}
        />
        <p className="mb-2 text-sm font-medium text-neutral-900">Период: {rangeTitle}</p>
        <p className="mb-6 border-b border-neutral-200 pb-4 text-sm leading-relaxed text-neutral-700">
          Учитываются позиции оплаченных заказов, не в статусе «Отменён», с датой создания заказа в
          периоде включительно.
        </p>

        <h3 className="mb-3 text-center text-sm font-semibold uppercase tracking-wide text-neutral-800">
          Сводка
        </h3>
        <ProfitSummaryTable summary={summary} />

        <h3 className="mb-3 text-center text-sm font-semibold uppercase tracking-wide text-neutral-800">
          Таблица 1. Разбивка по товарам
        </h3>
        <ProfitByProductTable rows={rows} />
      </article>
    </div>
  );
}
