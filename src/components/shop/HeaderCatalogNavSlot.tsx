import { HeaderCategoryNav } from "@/components/shop/HeaderCategoryNav";
import { CatalogDrawer } from "@/components/shop/CatalogDrawer";

type Cat = { id: number; name: string; slug: string };

type Props = {
  categories: Cat[];
  dark?: boolean;
};

/** На экранах &lt; lg — кнопка и выезжающая панель; с lg — горизонтальная навигация. */
export function HeaderCatalogNavSlot({ categories, dark = false }: Props) {
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="lg:hidden">
        <CatalogDrawer categories={categories} dark={dark} />
      </div>
      <div className="hidden lg:block">
        <HeaderCategoryNav categories={categories} dark={dark} />
      </div>
    </div>
  );
}
