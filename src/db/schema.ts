import { relations, sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
  index,
  type AnySQLiteColumn,
} from "drizzle-orm/sqlite-core";

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Родительская категория; null = корневая (макс. уровень вложенности — один: родитель → подкатегория). */
  parentId: integer("parent_id").references((): AnySQLiteColumn => categories.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  price: integer("price").notNull(),
  /** Себестоимость единицы товара, коп. (для отчёта о прибыли). */
  cost: integer("cost").notNull().default(0),
  imageUrl: text("image_url"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  stock: integer("stock").notNull().default(0),
  /** Склад отгрузки: почта России или СДЭК (копейки доставки — в настройках сайта). */
  fulfillmentType: text("fulfillment_type").notNull().default("russian_post"),
  /** Уровень качества для подсказки на витрине (задаётся в админке). */
  qualityTier: text("quality_tier", { enum: ["economy", "standard", "premium"] })
    .notNull()
    .default("standard"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const promoCodes = sqliteTable(
  "promo_codes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    code: text("code").notNull(),
    discountPercent: integer("discount_percent").notNull(),
    startsAt: integer("starts_at", { mode: "timestamp_ms" }).notNull(),
    endsAt: integer("ends_at", { mode: "timestamp_ms" }).notNull(),
    appliesToAll: integer("applies_to_all", { mode: "boolean" }).notNull().default(false),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    codeIdx: uniqueIndex("promo_codes_code").on(t.code),
  }),
);

export const promoCodeProducts = sqliteTable(
  "promo_code_products",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    promoCodeId: integer("promo_code_id")
      .notNull()
      .references(() => promoCodes.id, { onDelete: "cascade" }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
  },
  (t) => ({
    promoProductIdx: uniqueIndex("promo_code_products_unique").on(
      t.promoCodeId,
      t.productId,
    ),
  }),
);

export const adminUsers = sqliteTable("admin_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
});

export const carts = sqliteTable("carts", {
  id: text("id").primaryKey(),
  appliedPromoCodeId: integer("applied_promo_code_id").references(() => promoCodes.id, {
    onDelete: "set null",
  }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const cartItems = sqliteTable(
  "cart_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    cartId: text("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    reservedUntil: integer("reserved_until", { mode: "timestamp_ms" }),
  },
  (t) => ({
    cartProductIdx: uniqueIndex("cart_items_cart_product").on(
      t.cartId,
      t.productId,
    ),
  }),
);

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  publicOrderNumber: text("public_order_number"),
  status: text("status").notNull().default("new"),
  paymentStatus: text("payment_status", {
    enum: ["unpaid", "pending", "paid", "failed"],
  }).notNull().default("unpaid"),
  paymentFailureReason: text("payment_failure_reason"),
  paypassPublicId: text("paypass_public_id"),
  paypassClientRequestId: text("paypass_client_request_id"),
  paypassTelegramLink: text("paypass_telegram_link"),
  paypassStatus: text("paypass_status"),
  paypassLastCheckedAt: integer("paypass_last_checked_at", { mode: "timestamp_ms" }),
  paidAmount: integer("paid_amount"),
  paidAt: integer("paid_at", { mode: "timestamp_ms" }),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  telegram: text("telegram"),
  address: text("address"),
  comment: text("comment"),
  subtotalAmount: integer("subtotal_amount").notNull().default(0),
  autoDiscountAmount: integer("auto_discount_amount").notNull().default(0),
  promoCode: text("promo_code"),
  promoDiscountAmount: integer("promo_discount_amount").notNull().default(0),
  promoDiscountPercent: integer("promo_discount_percent").notNull().default(0),
  appliedDiscountMode: text("applied_discount_mode", {
    enum: ["none", "auto", "promo"],
  }).notNull().default("none"),
  /** Доставка почтой России, коп. (фикс за заказ, если в корзине были такие товары). */
  deliveryPostKopecks: integer("delivery_post_kopecks").notNull().default(0),
  /** Доставка СДЭК, коп. */
  deliveryCdekKopecks: integer("delivery_cdek_kopecks").notNull().default(0),
  /** Пункт выдачи СДЭК (адрес, код ПВЗ) — если в заказе была отгрузка СДЭК. */
  cdekPickupPoint: text("cdek_pickup_point"),
  totalAmount: integer("total_amount").notNull(),
  chatToken: text("chat_token"),
  adminLastReadAt: integer("admin_last_read_at"),
  /** Время перевода в статус «доставлен» (для отзывов «после использования»). */
  deliveredAt: integer("delivered_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const chatMessages = sqliteTable("chat_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  sender: text("sender", { enum: ["customer", "admin"] }).notNull(),
  text: text("text").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull(),
  priceAtOrder: integer("price_at_order").notNull(),
});

export const customerReviews = sqliteTable(
  "customer_reviews",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    /**
     * Уникальный ключ: `d:{orderId}` — доставка, `p:{orderItemId}` — товар по позиции.
     */
    reviewKey: text("review_key").notNull().unique(),
    kind: text("kind", { enum: ["delivery", "product"] }).notNull(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    orderItemId: integer("order_item_id").references(() => orderItems.id, {
      onDelete: "cascade",
    }),
    productId: integer("product_id").references(() => products.id, {
      onDelete: "restrict",
    }),
    rating: integer("rating").notNull(),
    text: text("text").notNull(),
    /** JSON-массив путей `/uploads/...` */
    photoUrls: text("photo_urls").notNull().default("[]"),
    moderationStatus: text("moderation_status", {
      enum: ["pending", "approved", "rejected"],
    })
      .notNull()
      .default("pending"),
    rejectionReason: text("rejection_reason"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    productModIdx: index("customer_reviews_product_mod").on(
      t.productId,
      t.moderationStatus,
    ),
    orderIdx: index("customer_reviews_order").on(t.orderId),
    kindIdx: index("customer_reviews_kind").on(t.kind),
  }),
);

export const promoCodeUsages = sqliteTable(
  "promo_code_usages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    promoCodeId: integer("promo_code_id")
      .notNull()
      .references(() => promoCodes.id, { onDelete: "cascade" }),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    usedAt: integer("used_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    promoEmailIdx: uniqueIndex("promo_code_usages_promo_email").on(t.promoCodeId, t.email),
  }),
);

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  cartItems: many(cartItems),
  orderItems: many(orderItems),
  promoCodeProducts: many(promoCodeProducts),
  customerReviews: many(customerReviews),
}));

export const cartsRelations = relations(carts, ({ many }) => ({
  items: many(cartItems),
}));

export const promoCodesRelations = relations(promoCodes, ({ many }) => ({
  productLinks: many(promoCodeProducts),
  usages: many(promoCodeUsages),
}));

export const promoCodeProductsRelations = relations(promoCodeProducts, ({ one }) => ({
  promoCode: one(promoCodes, {
    fields: [promoCodeProducts.promoCodeId],
    references: [promoCodes.id],
  }),
  product: one(products, {
    fields: [promoCodeProducts.productId],
    references: [products.id],
  }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
  promoCodeUsages: many(promoCodeUsages),
  customerReviews: many(customerReviews),
}));

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  reviews: many(customerReviews),
}));

export const customerReviewsRelations = relations(customerReviews, ({ one }) => ({
  order: one(orders, { fields: [customerReviews.orderId], references: [orders.id] }),
  orderItem: one(orderItems, {
    fields: [customerReviews.orderItemId],
    references: [orderItems.id],
  }),
  product: one(products, {
    fields: [customerReviews.productId],
    references: [products.id],
  }),
}));

export const promoCodeUsagesRelations = relations(promoCodeUsages, ({ one }) => ({
  promoCode: one(promoCodes, {
    fields: [promoCodeUsages.promoCodeId],
    references: [promoCodes.id],
  }),
  order: one(orders, {
    fields: [promoCodeUsages.orderId],
    references: [orders.id],
  }),
}));
