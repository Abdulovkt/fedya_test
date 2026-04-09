/** Price stored in kopecks (1 ₽ = 100) */
export function formatPrice(kopecks: number): string {
  const rub = kopecks / 100;
  return `${rub.toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ₽`;
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
