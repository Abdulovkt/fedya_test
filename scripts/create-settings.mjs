import Database from "better-sqlite3";
const db = new Database("dev.db");
db.exec("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT '')");
console.log("settings table created");
