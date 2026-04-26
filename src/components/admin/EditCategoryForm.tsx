"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateCategory, type UpdateCategoryState } from "@/app/actions/admin";

type Root = { id: number; name: string };

type Props = {
  category: {
    id: number;
    name: string;
    slug: string;
    sortOrder: number;
    parentId: number | null;
  };
  hasSubcategories: boolean;
  rootCategories: Root[];
};

export function EditCategoryForm({ category, hasSubcategories, rootCategories }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<UpdateCategoryState, FormData>(
    updateCategory,
    null,
  );

  useEffect(() => {
    if (!state?.ok) return;
    const t = setTimeout(() => router.push("/admin/categories"), 1500);
    return () => clearTimeout(t);
  }, [state, router]);

  const parentValue =
    category.parentId != null ? String(category.parentId) : "";

  return (
    <form
      action={formAction}
      className="mt-8 max-w-md space-y-3 rounded-xl border border-brand-border bg-brand-surface/40 p-5"
    >
      <input type="hidden" name="id" value={String(category.id)} />
      {state?.ok ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          Сохранено. Возврат к списку…
        </div>
      ) : null}
      {state?.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </div>
      ) : null}

      <div>
        <label htmlFor="ec-parentId" className="text-xs text-brand-muted">
          Родитель
        </label>
        {hasSubcategories ? (
          <>
            <p className="mt-1 rounded border border-amber-200/80 bg-amber-50 px-2 py-1.5 text-xs text-amber-950">
              У раздела есть подкатегории — он остаётся разделом верхнего уровня. Сначала удалите или
              перенесите вложенные категории, чтобы сменить вложенность.
            </p>
            <input type="hidden" name="parentId" value="" />
          </>
        ) : (
          <select
            id="ec-parentId"
            name="parentId"
            defaultValue={parentValue}
            className="mt-1 w-full cursor-pointer rounded border border-brand-border bg-brand-surface px-2 py-1.5 text-sm text-brand-heading"
          >
            <option value="">Корневая (раздел верхнего уровня)</option>
            {rootCategories
              .filter((r) => r.id !== category.id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        )}
      </div>

      <div>
        <label htmlFor="ec-name" className="text-xs text-brand-muted">
          Название
        </label>
        <input
          id="ec-name"
          name="name"
          required
          defaultValue={category.name}
          className="mt-1 w-full rounded border border-brand-border bg-brand-surface px-2 py-1.5 text-sm text-brand-heading"
        />
      </div>

      <div>
        <label htmlFor="ec-slug" className="text-xs text-brand-muted">
          Slug (необязательно)
        </label>
        <input
          id="ec-slug"
          name="slug"
          defaultValue={category.slug}
          className="mt-1 w-full rounded border border-brand-border bg-brand-surface px-2 py-1.5 text-sm text-brand-heading"
          placeholder="latin-slug"
        />
      </div>

      <div>
        <label htmlFor="ec-sortOrder" className="text-xs text-brand-muted">
          Порядок на витрине
        </label>
        <input
          id="ec-sortOrder"
          name="sortOrder"
          type="number"
          min={0}
          defaultValue={category.sortOrder}
          className="mt-1 w-full max-w-[12rem] rounded border border-brand-border bg-brand-surface px-2 py-1.5 text-sm text-brand-heading"
          aria-describedby="ec-sortOrder-hint"
        />
        <p id="ec-sortOrder-hint" className="mt-1.5 text-xs leading-relaxed text-brand-muted">
          Чем меньше число, тем раньше в списке. См. подсказки на странице категорий.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
      >
        {pending ? "Сохранение…" : "Сохранить"}
      </button>
    </form>
  );
}
