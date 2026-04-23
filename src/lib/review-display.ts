/** Имя для отзыва: первое слово из ФИО или «Покупатель». */
export function displayReviewCustomerName(full: string) {
  const t = full.trim().split(/\s+/)[0];
  return t || "Покупатель";
}

export function parseReviewPhotoUrls(json: string): string[] {
  try {
    const p = JSON.parse(json) as unknown;
    if (!Array.isArray(p)) return [];
    return p.filter((u): u is string => typeof u === "string" && u.startsWith("/"));
  } catch {
    return [];
  }
}

export function moderationLabel(s: "pending" | "approved" | "rejected") {
  if (s === "pending") return "На модерации";
  if (s === "approved") return "Опубликован";
  return "Отклонён";
}
