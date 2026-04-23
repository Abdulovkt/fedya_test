import Link from "next/link";

export type CatalogCategoryItem = {
  id: number;
  name: string;
  slug: string;
  productCount: number;
};

function productCountLabel(n: number): string {
  if (n === 0) return "пока нет товаров";
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} товар`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} товара`;
  return `${n} товаров`;
}

type Props = {
  categories: CatalogCategoryItem[];
};

export function CatalogCategoryGrid({ categories }: Props) {
  return (
    <ul
      className="mt-10 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {categories.map((c) => (
        <li key={c.id}>
          <Link
            href={`/category/${c.slug}`}
            className="group flex h-full min-h-[5.5rem] cursor-pointer items-center justify-between gap-3 rounded-xl border border-brand-border bg-brand-elevated px-4 py-4 shadow-sm transition-colors duration-200 focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand-teal/50 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg hover:border-brand/25 hover:bg-brand-elevated/80"
          >
            <div className="min-w-0 text-left">
              <span className="block text-base font-semibold text-brand-heading">
                {c.name}
              </span>
              <span className="mt-0.5 block text-sm text-brand-muted">
                {productCountLabel(c.productCount)}
              </span>
            </div>
            <span
              className="shrink-0 text-brand-muted transition group-hover:translate-x-0.5 group-hover:text-brand"
              aria-hidden="true"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
