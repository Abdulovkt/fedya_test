import { HeaderCategoryNav } from "@/components/shop/HeaderCategoryNav";
import { CatalogDrawer } from "@/components/shop/CatalogDrawer";

type Cat = { id: number; name: string; slug: string; parentId: number | null };

type Props = {
  /** Все категории (с parentId) — для вложенного меню. */
  allCategories: Cat[];
  /** Только корневые — для чипов в шапке (без дублей с подкатегориями). */
  rootCategories: Cat[];
  dark?: boolean;
};

/** На экранах &lt; lg — кнопка и выезжающая панель; с lg — горизонтальная навигация. */
export function HeaderCatalogNavSlot({
  allCategories,
  rootCategories,
  dark = false,
}: Props) {
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="lg:hidden">
        <CatalogDrawer allCategories={allCategories} dark={dark} />
      </div>
      <div className="hidden lg:block">
        <HeaderCategoryNav
          categories={rootCategories}
          allCategories={allCategories}
          dark={dark}
        />
      </div>
    </div>
  );
}
