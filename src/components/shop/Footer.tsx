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
            <ul className="mt-2 space-y-1.5 text-sm text-slate-400">
              <li>
                <Link
                  href="/catalog"
                  className="transition-colors hover:text-brand-teal"
                >
                  Каталог
                </Link>
              </li>
              <li>
                <Link href="/cart" className="transition-colors hover:text-brand-teal">
                  Корзина
                </Link>
              </li>
              <li>
                <Link href="/reviews" className="transition-colors hover:text-brand-teal">
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
