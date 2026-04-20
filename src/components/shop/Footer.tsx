import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-brand-border bg-brand-surface">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Link
              href="/"
              className="relative flex h-10 w-[138px] items-center"
              aria-label="FedorPharm"
            >
              <Image
                src="/logo-black.png"
                alt="FedorPharm"
                fill
                className="object-contain"
                sizes="138px"
              />
            </Link>
          </div>
          <div>
            <p className="text-sm font-medium text-brand-heading">Магазин</p>
            <ul className="mt-2 space-y-1 text-sm text-brand-muted">
              <li>
                <Link href="/catalog" className="hover:text-brand-teal">
                  Каталог
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-brand-teal">
                  Корзина
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-brand-heading">
              Администрирование
            </p>
            <ul className="mt-2 space-y-1 text-sm text-brand-muted">
              <li>
                <Link href="/admin" className="hover:text-brand-teal">
                  Панель администратора
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-brand-muted/70">
          © {new Date().getFullYear()}. Все права защищены.
        </p>
      </div>
    </footer>
  );
}
