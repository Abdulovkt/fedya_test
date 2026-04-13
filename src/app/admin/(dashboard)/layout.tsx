import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminSignOut } from "@/components/admin/AdminSignOut";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/admin/login");
  }
  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
      <aside className="w-full shrink-0 space-y-2 rounded-xl border border-brand-border bg-brand-surface/50 p-4 sm:w-56">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
          Админка
        </p>
        <nav className="flex flex-col gap-1 text-sm">
          <Link
            href="/admin"
            className="rounded-md px-2 py-1.5 text-brand-heading hover:bg-brand-elevated"
          >
            Обзор
          </Link>
          <Link
            href="/admin/categories"
            className="rounded-md px-2 py-1.5 text-brand-heading hover:bg-brand-elevated"
          >
            Категории
          </Link>
          <Link
            href="/admin/products"
            className="rounded-md px-2 py-1.5 text-brand-heading hover:bg-brand-elevated"
          >
            Товары
          </Link>
          <Link
            href="/admin/orders"
            className="rounded-md px-2 py-1.5 text-brand-heading hover:bg-brand-elevated"
          >
            Заказы
          </Link>
          <Link
            href="/admin/chats"
            className="rounded-md px-2 py-1.5 text-brand-heading hover:bg-brand-elevated"
          >
            Чаты
          </Link>
        </nav>
        <div className="border-t border-brand-border pt-3">
          <Link
            href="/"
            className="text-xs text-brand-muted hover:text-brand-teal"
          >
            На сайт
          </Link>
          <div className="mt-2">
            <AdminSignOut />
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
