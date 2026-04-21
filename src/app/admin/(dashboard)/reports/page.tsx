import Link from "next/link";

export const metadata = { title: "Отчёты" };

export default function AdminReportsIndexPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-brand-heading">Отчёты</h1>
      <p className="mt-2 text-sm text-brand-muted">
        Выберите отчёт, задайте период (с даты по дату по умолчанию — с 1-го числа месяца по
        сегодня) и при необходимости распечатайте или сохраните в PDF.
      </p>
      <ul className="mt-8 space-y-3">
        <li>
          <Link
            href="/admin/reports/demand"
            className="block rounded-xl border border-brand-border bg-brand-surface/40 p-5 transition hover:border-brand-teal/40"
          >
            <h2 className="font-semibold text-brand-heading">Отчёт о спросе на товары</h2>
            <p className="mt-1 text-sm text-brand-muted">
              Топ и низ продаж за период; по умолчанию по 5 позиций, число можно изменить.
            </p>
          </Link>
        </li>
        <li>
          <Link
            href="/admin/reports/stock"
            className="block rounded-xl border border-brand-border bg-brand-surface/40 p-5 transition hover:border-brand-teal/40"
          >
            <h2 className="font-semibold text-brand-heading">Отчёт по остаткам</h2>
            <p className="mt-1 text-sm text-brand-muted">
              Текущие остатки из каталога; дата — день формирования отчёта.
            </p>
          </Link>
        </li>
        <li>
          <Link
            href="/admin/reports/customers"
            className="block rounded-xl border border-brand-border bg-brand-surface/40 p-5 transition hover:border-brand-teal/40"
          >
            <h2 className="font-semibold text-brand-heading">Отчёт по клиентам</h2>
            <p className="mt-1 text-sm text-brand-muted">
              Клиенты и суммы по оплаченным заказам за выбранный период.
            </p>
          </Link>
        </li>
        <li>
          <Link
            href="/admin/reports/profit"
            className="block rounded-xl border border-brand-border bg-brand-surface/40 p-5 transition hover:border-brand-teal/40"
          >
            <h2 className="font-semibold text-brand-heading">Отчёт о прибыли</h2>
            <p className="mt-1 text-sm text-brand-muted">
              Выручка, себестоимость и валовая прибыль по товарам за период (нужна себестоимость в
              карточке товара).
            </p>
          </Link>
        </li>
      </ul>
    </div>
  );
}
