import "dotenv/config";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { adminUsers, categories, products } from "../src/db/schema";

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";

  const existing = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, adminEmail))
    .limit(1);
  if (!existing.length) {
    await db.insert(adminUsers).values({
      email: adminEmail,
      passwordHash: await hash(adminPassword, 10),
    });
    console.log("Admin user created:", adminEmail);
  } else {
    console.log("Admin user already exists:", adminEmail);
  }

  const catRows = await db.select().from(categories).limit(1);
  if (!catRows.length) {
    const cats = await db
      .insert(categories)
      .values([
        { name: "Протеин", slug: "protein", sortOrder: 1 },
        { name: "Креатин", slug: "creatine", sortOrder: 2 },
        { name: "BCAA и аминокислоты", slug: "bcaa", sortOrder: 3 },
        { name: "Витамины и добавки", slug: "vitamins", sortOrder: 4 },
      ])
      .returning();

    const protein = cats.find((c) => c.slug === "protein")!;
    const creatine = cats.find((c) => c.slug === "creatine")!;

    await db.insert(products).values([
      {
        categoryId: protein.id,
        name: "Сывороточный протеин 900 г",
        slug: "whey-protein-900",
        description:
          "Высококачественный сывороточный протеин для набора мышечной массы и восстановления после тренировок.",
        price: 349000,
        imageUrl: null,
        isActive: true,
        stock: 50,
        fulfillmentType: "russian_post",
      },
      {
        categoryId: protein.id,
        name: "Казеин медленного усвоения 900 г",
        slug: "casein-900",
        description:
          "Медленный белок для длительного насыщения — удобно принимать перед сном.",
        price: 299000,
        imageUrl: null,
        isActive: true,
        stock: 30,
        fulfillmentType: "cdek",
      },
      {
        categoryId: creatine.id,
        name: "Креатин моногидрат 300 г",
        slug: "creatine-300",
        description:
          "Классический креатин моногидрат для силы и взрывной работы.",
        price: 89000,
        imageUrl: null,
        isActive: true,
        stock: 100,
        fulfillmentType: "russian_post",
      },
    ]);
    console.log("Demo categories and products inserted.");
  } else {
    console.log("Demo data already present, skipping product seed.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
