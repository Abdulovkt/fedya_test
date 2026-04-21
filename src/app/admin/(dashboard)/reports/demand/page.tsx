import {
  DemandTable,
  ReportHeader,
} from "@/components/admin/ReportBlocks";
import { SingleReportToolbar } from "@/components/admin/SingleReportToolbar";
import {
  formatReportGeneratedAt,
  formatReportRangeRu,
  getProductDemandBottomForRange,
  getProductDemandTopForRange,
  getRangeBoundsFromYmd,
  parseDemandLimit,
  parseReportDateRange,
} from "@/lib/reports";

export const metadata = { title: "Отчёт о спросе" };

type SearchParams = Promise<{ from?: string; to?: string; limit?: string }>;

export default async function ReportDemandPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { from: fromRaw, to: toRaw, limit: limitRaw } = await searchParams;
  const { from, to } = parseReportDateRange(fromRaw, toRaw);
  const limit = parseDemandLimit(limitRaw);
  const { startMs, endMs } = getRangeBoundsFromYmd(from, to);

  const [topDemand, bottomDemand] = await Promise.all([
    getProductDemandTopForRange(startMs, endMs, limit),
    getProductDemandBottomForRange(startMs, endMs, limit),
  ]);

  const generatedAt = formatReportGeneratedAt(new Date());
  const rangeTitle = formatReportRangeRu(from, to);

  return (
    <div className="admin-report max-w-4xl">
      <SingleReportToolbar
        reportPath="/admin/reports/demand"
        fromValue={from}
        toValue={to}
        demandLimitValue={limit}
      />

      <p className="print:hidden mb-6 text-sm text-brand-muted">
        Продажи за период: <strong>{rangeTitle}</strong>. Оплаченные заказы, статус не «Отменён».
        В каждой таблице — до <strong>{limit}</strong> позиций (наибольший и наименьший спрос).
      </p>

      <article className="admin-report-sheet border border-neutral-300 bg-white p-8 text-neutral-900 shadow-sm print:shadow-none">
        <ReportHeader
          code="ОП-СПР-01"
          title="Отчёт о спросе на товары"
          generatedAt={generatedAt}
        />
        <p className="mb-2 text-sm font-medium text-neutral-900">Период: {rangeTitle}</p>
        <p className="mb-6 border-b border-neutral-200 pb-4 text-sm leading-relaxed text-neutral-700">
          Учитываются позиции заказов, созданных в указанный период включительно. Выручка — по
          ценам в строках заказа. В каждой таблице выводится не более {limit} наименований товара.
        </p>

        <h3 className="mb-3 text-center text-sm font-semibold uppercase tracking-wide text-neutral-800">
          Таблица 1. Наибольший спрос ({limit} позиций)
        </h3>
        <DemandTable rows={topDemand} emptyHint="За выбранный период нет оплаченных продаж." />

        <h3 className="mb-3 mt-10 text-center text-sm font-semibold uppercase tracking-wide text-neutral-800">
          Таблица 2. Наименьший спрос ({limit} позиций)
        </h3>
        <DemandTable rows={bottomDemand} emptyHint="В каталоге нет товаров." />
      </article>
    </div>
  );
}
