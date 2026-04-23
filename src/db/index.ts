import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

type SqliteCtor = typeof import("better-sqlite3");
/** Instance type without a static runtime import of better-sqlite3 (keeps native addon off the module graph until first use). */
type SqliteDatabase = InstanceType<SqliteCtor>;

const globalForDb = globalThis as unknown as {
  sqlite: SqliteDatabase | undefined;
};

function getDatabasePath() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  if (url.startsWith("file:")) {
    return url.slice("file:".length);
  }
  return url;
}

function hasColumn(db: SqliteDatabase, tableName: string, columnName: string) {
  const rows = db.pragma(`table_info(${tableName})`) as Array<{ name: string }>;
  return rows.some((row) => row.name === columnName);
}

function ensurePromoSchema(db: SqliteDatabase) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS promo_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL,
      discount_percent INTEGER NOT NULL,
      starts_at INTEGER NOT NULL,
      ends_at INTEGER NOT NULL,
      applies_to_all INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );

    CREATE UNIQUE INDEX IF NOT EXISTS promo_codes_code
    ON promo_codes (code);

    CREATE TABLE IF NOT EXISTS promo_code_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      promo_code_id INTEGER NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS promo_code_products_unique
    ON promo_code_products (promo_code_id, product_id);

    CREATE TABLE IF NOT EXISTS promo_code_usages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      promo_code_id INTEGER NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      used_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );

    CREATE UNIQUE INDEX IF NOT EXISTS promo_code_usages_promo_email
    ON promo_code_usages (promo_code_id, email);
  `);

  if (!hasColumn(db, "carts", "applied_promo_code_id")) {
    db.exec(
      "ALTER TABLE carts ADD COLUMN applied_promo_code_id INTEGER REFERENCES promo_codes(id) ON DELETE SET NULL;",
    );
  }

  if (!hasColumn(db, "orders", "subtotal_amount")) {
    db.exec("ALTER TABLE orders ADD COLUMN subtotal_amount INTEGER NOT NULL DEFAULT 0;");
  }
  if (!hasColumn(db, "orders", "auto_discount_amount")) {
    db.exec("ALTER TABLE orders ADD COLUMN auto_discount_amount INTEGER NOT NULL DEFAULT 0;");
  }
  if (!hasColumn(db, "orders", "promo_code")) {
    db.exec("ALTER TABLE orders ADD COLUMN promo_code TEXT;");
  }
  if (!hasColumn(db, "orders", "promo_discount_amount")) {
    db.exec("ALTER TABLE orders ADD COLUMN promo_discount_amount INTEGER NOT NULL DEFAULT 0;");
  }
  if (!hasColumn(db, "orders", "promo_discount_percent")) {
    db.exec("ALTER TABLE orders ADD COLUMN promo_discount_percent INTEGER NOT NULL DEFAULT 0;");
  }
  if (!hasColumn(db, "orders", "applied_discount_mode")) {
    db.exec(
      "ALTER TABLE orders ADD COLUMN applied_discount_mode TEXT NOT NULL DEFAULT 'none';",
    );
  }
  if (!hasColumn(db, "orders", "payment_status")) {
    db.exec("ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid';");
  }
  if (!hasColumn(db, "orders", "payment_failure_reason")) {
    db.exec("ALTER TABLE orders ADD COLUMN payment_failure_reason TEXT;");
  }
  if (!hasColumn(db, "orders", "paypass_public_id")) {
    db.exec("ALTER TABLE orders ADD COLUMN paypass_public_id TEXT;");
  }
  if (!hasColumn(db, "orders", "paypass_client_request_id")) {
    db.exec("ALTER TABLE orders ADD COLUMN paypass_client_request_id TEXT;");
  }
  if (!hasColumn(db, "orders", "paypass_telegram_link")) {
    db.exec("ALTER TABLE orders ADD COLUMN paypass_telegram_link TEXT;");
  }
  if (!hasColumn(db, "orders", "paypass_status")) {
    db.exec("ALTER TABLE orders ADD COLUMN paypass_status TEXT;");
  }
  if (!hasColumn(db, "orders", "paypass_last_checked_at")) {
    db.exec("ALTER TABLE orders ADD COLUMN paypass_last_checked_at INTEGER;");
  }
  if (!hasColumn(db, "orders", "paid_amount")) {
    db.exec("ALTER TABLE orders ADD COLUMN paid_amount INTEGER;");
  }
  if (!hasColumn(db, "orders", "paid_at")) {
    db.exec("ALTER TABLE orders ADD COLUMN paid_at INTEGER;");
  }
  if (!hasColumn(db, "orders", "public_order_number")) {
    db.exec("ALTER TABLE orders ADD COLUMN public_order_number TEXT;");
  }
  db.exec(
    "CREATE UNIQUE INDEX IF NOT EXISTS orders_public_order_number_idx ON orders (public_order_number);",
  );

  if (!hasColumn(db, "products", "cost")) {
    db.exec("ALTER TABLE products ADD COLUMN cost INTEGER NOT NULL DEFAULT 0;");
  }
  if (!hasColumn(db, "products", "fulfillment_type")) {
    db.exec(
      "ALTER TABLE products ADD COLUMN fulfillment_type TEXT NOT NULL DEFAULT 'russian_post';",
    );
  }

  if (!hasColumn(db, "categories", "parent_id")) {
    db.exec(
      "ALTER TABLE categories ADD COLUMN parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;",
    );
    db.exec(
      "CREATE INDEX IF NOT EXISTS categories_parent_id_idx ON categories (parent_id);",
    );
  }
}

function openSqlite(): SqliteDatabase {
  const Database = require("better-sqlite3") as SqliteCtor;
  const sqlite = globalForDb.sqlite ?? new Database(getDatabasePath());
  sqlite.pragma("journal_mode = WAL");
  ensurePromoSchema(sqlite);

  if (process.env.NODE_ENV !== "production") {
    globalForDb.sqlite = sqlite;
  }
  return sqlite;
}

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let drizzleSingleton: DrizzleDb | undefined;

function getDrizzle(): DrizzleDb {
  if (!drizzleSingleton) {
    drizzleSingleton = drizzle(openSqlite(), { schema });
  }
  return drizzleSingleton;
}

export const db = new Proxy({} as DrizzleDb, {
  get(_target, prop, receiver) {
    const inst = getDrizzle();
    const value = Reflect.get(inst, prop, receiver);
    if (typeof value === "function") {
      return value.bind(inst);
    }
    return value;
  },
});
