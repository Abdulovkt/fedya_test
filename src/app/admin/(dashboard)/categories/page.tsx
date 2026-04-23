import { asc, isNull } from "drizzle-orm";
import { createCategory, deleteCategory } from "@/app/actions/admin";
import { db } from "@/db";
import { categories } from "@/db/schema";

export const metadata = { title: "Категории" };

export default async function AdminCategoriesPage() {
  const list = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  const rootCategories = await db
    .select()
    .from(categories)
    .where(isNull(categories.parentId))
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  const byId = new Map(list.map((c) => [c.id, c] as const));

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-heading">Категории</h1>
      <p className="mt-1 max-w-lg text-sm text-brand-muted">
        Подкатегория: в форме ниже в поле «Родитель» выберите раздел верхнего уровня (например «Протеин»), задайте
        название «Сывороточный» и slug. Вложенность одна: подкатегория не может быть родителем.
      </p>
      <form
        action={createCategory}
        className="mt-8 max-w-md space-y-3 rounded-xl border border-brand-border bg-brand-surface/40 p-5"
      >
        <h2 className="text-sm font-semibold text-brand-heading">Новая категория</h2>
        <div>
          <label htmlFor="parentId" className="text-xs text-brand-muted">
            Родитель
          </label>
          <select
            id="parentId"
            name="parentId"
            className="mt-1 w-full rounded border border-brand-border bg-brand-surface px-2 py-1.5 text-sm text-brand-heading"
            defaultValue=""
          >
            <option value="">Корневая (раздел верхнего уровня)</option>
            {rootCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="name" className="text-xs text-brand-muted">
            Название
          </label>
          <input
            id="name"
            name="name"
            required
            className="mt-1 w-full rounded border border-brand-border bg-brand-surface px-2 py-1.5 text-sm text-brand-heading"
          />
        </div>
        <div>
          <label htmlFor="slug" className="text-xs text-brand-muted">
            Slug (необязательно)
          </label>
          <input
            id="slug"
            name="slug"
            className="mt-1 w-full rounded border border-brand-border bg-brand-surface px-2 py-1.5 text-sm text-brand-heading"
            placeholder="latin-slug"
          />
        </div>
        <div>
          <label htmlFor="sortOrder" className="text-xs text-brand-muted">
            Порядок
          </label>
          <input
            id="sortOrder"
            name="sortOrder"
            type="number"
            defaultValue={0}
            className="mt-1 w-full rounded border border-brand-border bg-brand-surface px-2 py-1.5 text-sm text-brand-heading"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white"
        >
          Добавить
        </button>
      </form>

      <div className="mt-10 overflow-x-auto rounded-xl border border-brand-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-surface/80 text-brand-muted">
            <tr>
              <th className="px-4 py-2">Название</th>
              <th className="px-4 py-2">Родитель</th>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2">Порядок</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {list.map((c) => {
              const parent = c.parentId != null ? byId.get(c.parentId) : null;
              return (
                <tr key={c.id} className="border-t border-brand-border">
                  <td
                    className={`px-4 py-2 text-brand-heading ${c.parentId != null ? "pl-6" : ""}`}
                  >
                    {c.parentId != null ? (
                      <span className="text-brand-muted" aria-hidden="true">
                        ↳{" "}
                      </span>
                    ) : null}
                    {c.name}
                  </td>
                  <td className="px-4 py-2 text-brand-muted">
                    {parent ? parent.name : "—"}
                  </td>
                  <td className="px-4 py-2 text-brand-muted">{c.slug}</td>
                  <td className="px-4 py-2">{c.sortOrder}</td>
                  <td className="px-4 py-2 text-right">
                    <form action={deleteCategory}>
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        className="text-xs text-red-400 hover:underline"
                      >
                        Удалить
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
