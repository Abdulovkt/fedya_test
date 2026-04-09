"use client";

import Image from "next/image";
import { useRef, useState } from "react";
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  const currentImage = preview ?? (mode === "edit" ? (product?.imageUrl ?? null) : null);

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

      {/* Image upload */}
      <div>
        <p className="text-sm text-brand-muted">
          Фото{mode === "edit" ? " (оставьте без изменений, чтобы не менять)" : ""}
        </p>

        <input
          ref={fileInputRef}
          id="image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          className="sr-only"
        />

        <div className="mt-2 flex items-start gap-4">
          {/* Preview box */}
          <div
            className={`relative h-32 w-32 shrink-0 overflow-hidden rounded-lg border-2 border-dashed ${
              currentImage
                ? "border-brand-border"
                : "border-brand-border bg-brand-elevated"
            } flex items-center justify-center`}
          >
            {currentImage ? (
              <Image
                src={currentImage}
                alt="Превью"
                fill
                unoptimized={preview !== null}
                className="object-cover"
              />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-brand-muted/40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            )}
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-brand-border bg-brand-surface px-4 py-2 text-sm font-medium text-brand-heading shadow-sm hover:border-brand/40 hover:text-brand"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {currentImage ? "Заменить фото" : "Выбрать фото"}
            </button>

            {preview && (
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-left text-xs text-brand-muted hover:text-brand"
              >
                Отменить выбор
              </button>
            )}

            {currentImage && (
              <p className="text-xs text-brand-muted/70">
                {preview ? "Новое фото выбрано" : "Текущее фото"}
              </p>
            )}
          </div>
        </div>
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
