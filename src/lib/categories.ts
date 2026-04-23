import type { categories } from "@/db/schema";

export type CategoryRecord = typeof categories.$inferSelect;

function bySortThenName(a: CategoryRecord, b: CategoryRecord) {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return a.name.localeCompare(b.name, "ru");
}

export function partitionRootsAndChildren(all: CategoryRecord[]) {
  const roots = all.filter((c) => c.parentId == null).sort(bySortThenName);
  const children = all.filter((c) => c.parentId != null).sort(bySortThenName);
  return { roots, children };
}

export function childrenOf(parentId: number, all: CategoryRecord[]) {
  return all.filter((c) => c.parentId === parentId).sort(bySortThenName);
}

/**
 * Сумма товаров в категории и во всех прямых подкатегориях (глубина 1).
 */
export function aggregateProductCountForDisplay(
  cat: CategoryRecord,
  directCount: ReadonlyMap<number, number>,
  all: CategoryRecord[],
): number {
  let n = directCount.get(cat.id) ?? 0;
  for (const ch of childrenOf(cat.id, all)) {
    n += directCount.get(ch.id) ?? 0;
  }
  return n;
}

export function subcategoryCount(cat: CategoryRecord, all: CategoryRecord[]): number {
  return childrenOf(cat.id, all).length;
}
