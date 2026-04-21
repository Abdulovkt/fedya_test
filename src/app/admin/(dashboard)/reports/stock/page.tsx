import { ReportHeader, StockTable } from "@/components/admin/ReportBlocks";
import { ReportBackPrintToolbar } from "@/components/admin/ReportBackPrintToolbar";
import {
  formatReportDate,
  formatReportDateLongRu,
  formatReportGeneratedAt,
  getStockReport,
} from "@/lib/reports";

export const metadata = { title: "Отчёт по остаткам" };

export default async function ReportStockPage() {
  const stockRows = await getStockReport();

  const now = new Date();
  const generatedAt = formatReportGeneratedAt(now);
  const reportDayLabel = formatReportDateLongRu(formatReportDate(now));

  return (
    <div className="admin-report max-w-4xl">
      <ReportBackPrintToolbar />

      <p className="print:hidden mb-6 text-sm text-brand-muted">
        Числа в графе «Остаток» — <strong>текущие</strong> из каталога на момент открытия страницы.
        Дата в отчёте — день формирования; история движения в системе не хранится.
      </p>

      <article className="admin-report-sheet border border-neutral-300 bg-white p-8 text-neutral-900 shadow-sm print:shadow-none">
        <ReportHeader
          code="ОП-ОСТ-01"
          title="Отчёт по остаткам товаров на складе"
          generatedAt={generatedAt}
        />
        <p className="mb-2 text-sm font-medium text-neutral-900">
          Дата формирования (текущий день): {reportDayLabel}
        </p>
        <p className="mb-6 border-b border-neutral-200 pb-4 text-sm leading-relaxed text-neutral-700">
          Графа «Примечание» — условная оценка запаса для оперативного контроля.
        </p>

        <StockTable rows={stockRows} />
      </article>
    </div>
  );
}
