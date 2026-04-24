import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800 bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2">
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
                className="object-contain brightness-0 invert"
                sizes="138px"
              />
            </Link>
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-slate-200">
              Магазин
            </p>
            <ul className="mt-3 flex list-none flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-400 sm:gap-x-7">
              <li>
                <Link
                  href="/catalog"
                  className="cursor-pointer whitespace-nowrap transition-colors duration-200 hover:text-brand-teal focus-visible:rounded-sm focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand-teal/45 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                >
                  Каталог
                </Link>
              </li>
              <li>
                <Link
                  href="/cart"
                  className="cursor-pointer whitespace-nowrap transition-colors duration-200 hover:text-brand-teal focus-visible:rounded-sm focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand-teal/45 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                >
                  Корзина
                </Link>
              </li>
              <li>
                <Link
                  href="/reviews"
                  className="cursor-pointer whitespace-nowrap transition-colors duration-200 hover:text-brand-teal focus-visible:rounded-sm focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand-teal/45 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                >
                  Отзывы
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-slate-600">
          © {new Date().getFullYear()}. Все права защищены.
        </p>
      </div>
    </footer>
  );
}
