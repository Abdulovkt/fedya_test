-- Subcategories: self-reference (nullable parent_id)
PRAGMA foreign_keys=OFF;
ALTER TABLE "categories" ADD COLUMN "parent_id" integer REFERENCES categories(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "categories_parent_id_idx" ON "categories" ("parent_id");
PRAGMA foreign_keys=ON;
