import Database from "better-sqlite3";
const db = new Database("dev.db");

// mirrors catalog/page.tsx logic: JS toLowerCase filter
const allProducts = db
  .prepare("SELECT name FROM products WHERE is_active=1")
  .all()
  .map((r) => r.name);

const search = (q) => {
  const needle = q.trim().toLowerCase();
  return allProducts.filter((name) => name.toLowerCase().includes(needle));
};

const cases = ["протеин", "ПРОТЕИН", "Протеин", "казеин", "КАЗЕИН", "крЕатин", "СЫВОРОТ"];
for (const q of cases) {
  console.log(`"${q}" =>`, search(q));
}
