import Image from "next/image";
import { createProduct, updateProduct } from "@/app/actions/admin";

type Category = { id: number; name: string };

type Props = {
  categories: Category[];
  mode: "create" | "edit";
  product?: {
    id: number;
    categoryId: number;
    name: string;
    slug: string;
    description: string | null;
    priceKopecks: number;
    stock: number;
    isActive: boolean;
    imageUrl: string | null;
  };
};

export function ProductForm({ categories, mode, product }: Props) {
  const action = mode === "create" ? createProduct : updateProduct;
  const priceRub = product ? product.priceKopecks / 100 : "";

  return (
    <form
      action={action}
      encType="multipart/form-data"
      className="max-w-xl space-y-4 rounded-xl border border-brand-border bg-brand-surface/40 p-6"
    >
      {mode === "edit" && product ? (
        <input type="hidden" name="id" value={product.id} />
      ) : null}
      <div>
        <label htmlFor="categoryId" className="text-sm text-brand-muted">
          Категория
        </label>
        <select
          id="categoryId"
          name="categoryId"
          required
          defaultValue={product?.categoryId}
          className="mt-1 w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-brand-heading"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="name" className="text-sm text-brand-muted">
          Название
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={product?.name}
          className="mt-1 w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-brand-heading"
        />
      </div>
      <div>
        <label htmlFor="slug" className="text-sm text-brand-muted">
          Slug (необязательно)
        </label>
        <input
          id="slug"
          name="slug"
          defaultValue={product?.slug}
          className="mt-1 w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-brand-heading"
        />
      </div>
      <div>
        <label htmlFor="description" className="text-sm text-brand-muted">
          Описание
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={product?.description ?? ""}
          className="mt-1 w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-brand-heading"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="priceRub" className="text-sm text-brand-muted">
            Цена (₽)
          </label>
          <input
            id="priceRub"
            name="priceRub"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={priceRub === "" ? undefined : priceRub}
            className="mt-1 w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-brand-heading"
          />
        </div>
        <div>
          <label htmlFor="stock" className="text-sm text-brand-muted">
            Остаток
          </label>
          <input
            id="stock"
            name="stock"
            type="number"
            min="0"
            required
            defaultValue={product?.stock ?? 0}
            className="mt-1 w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-brand-heading"
          />
        </div>
      </div>
      <div>
        <label htmlFor="image" className="text-sm text-brand-muted">
          Фото {mode === "edit" ? "(оставьте пустым, чтобы не менять)" : ""}
        </label>
        <input
          id="image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="mt-1 w-full text-sm text-brand-muted"
        />
        {mode === "edit" && product?.imageUrl ? (
          <div className="relative mt-2 h-32 w-32 overflow-hidden rounded border border-brand-border">
            <Image
              src={product.imageUrl}
              alt=""
              fill
              className="object-cover"
            />
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <input
          id="isActive"
          name="isActive"
          type="checkbox"
          defaultChecked={product?.isActive ?? true}
          className="h-4 w-4 rounded border-brand-border"
        />
        <label htmlFor="isActive" className="text-sm text-brand-muted">
          Активен на витрине
        </label>
      </div>
      <button
        type="submit"
        className="rounded-lg bg-brand px-6 py-2 font-semibold text-white hover:bg-brand-hover"
      >
        {mode === "create" ? "Создать товар" : "Сохранить"}
      </button>
    </form>
  );
}
