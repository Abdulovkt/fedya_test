import Link from "next/link";

export const metadata = { title: "Админка" };

export default function AdminHomePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-heading">Панель управления</h1>
      <p className="mt-2 text-brand-muted">
        Управляйте категориями, товарами и заказами.
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/categories"
          className="rounded-xl border border-brand-border bg-brand-surface/40 p-5 hover:border-brand/40"
        >
          <h2 className="font-semibold text-brand">Категории</h2>
          <p className="mt-1 text-sm text-brand-muted">Добавить и удалить</p>
        </Link>
        <Link
          href="/admin/products"
          className="rounded-xl border border-brand-border bg-brand-surface/40 p-5 hover:border-brand/40"
        >
          <h2 className="font-semibold text-brand">Товары</h2>
          <p className="mt-1 text-sm text-brand-muted">Каталог и фото</p>
        </Link>
        <Link
          href="/admin/orders"
          className="rounded-xl border border-brand-border bg-brand-surface/40 p-5 hover:border-brand/40"
        >
          <h2 className="font-semibold text-brand">Заказы</h2>
          <p className="mt-1 text-sm text-brand-muted">Статусы</p>
        </Link>
      </ul>
    </div>
  );
}
