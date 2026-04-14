/** Price stored in kopecks (1 ₽ = 100) */
export function formatPrice(kopecks: number): string {
  const rub = kopecks / 100;
  return `${rub.toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ₽`;
}

export type StockLabel = {
  text: string;
  className: string;
};

/** Returns a human-readable stock label with Tailwind colour classes. */
export function getStockLabel(stock: number): StockLabel {
  if (stock <= 0) return { text: "Нет в наличии", className: "bg-red-500/15 text-red-400" };
  if (stock <= 5)  return { text: "Мало",          className: "bg-orange-500/15 text-orange-400" };
  if (stock <= 20) return { text: "Достаточно",    className: "bg-yellow-500/15 text-yellow-400" };
  return             { text: "Много",             className: "bg-green-500/15 text-green-400" };
}

export function slugify(text: string): string {
  const map: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "e",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya",
  };
  const s = text.toLowerCase().trim();
  let out = "";
  for (const ch of s) {
    if (map[ch]) out += map[ch];
    else if (/[a-z0-9]/.test(ch)) out += ch;
    else if (/[\s_\-/]/.test(ch) || ch === ".") out += "-";
  }
  out = out.replace(/-+/g, "-").replace(/^-|-$/g, "");
  return out || "item";
}
