import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  sqlite: Database.Database | undefined;
};

function getDatabasePath() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  if (url.startsWith("file:")) {
    return url.slice("file:".length);
  }
  return url;
}

const sqlite =
  globalForDb.sqlite ?? new Database(getDatabasePath());
sqlite.pragma("journal_mode = WAL");

if (process.env.NODE_ENV !== "production") {
  globalForDb.sqlite = sqlite;
}

export const db = drizzle(sqlite, { schema });
