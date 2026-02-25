import {
  boolean,
  decimal,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const dealStatusEnum = pgEnum("deal_status", ["active", "expired", "unverified"]);

// ─── Retailers ────────────────────────────────────────────────────────────────
export const retailers = pgTable("retailers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  domain: varchar("domain", { length: 255 }).notNull().unique(),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Categories ───────────────────────────────────────────────────────────────
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
});

// ─── Deals ────────────────────────────────────────────────────────────────────
export const deals = pgTable(
  "deals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    url: text("url").notNull(),
    imageUrl: text("image_url"),
    originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
    salePrice: decimal("sale_price", { precision: 10, scale: 2 }),
    discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }),
    status: dealStatusEnum("status").default("active").notNull(),
    retailerId: uuid("retailer_id").references(() => retailers.id),
    categoryId: uuid("category_id").references(() => categories.id),
    expiresAt: timestamp("expires_at"),
    scrapedAt: timestamp("scraped_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    featured: boolean("featured").default(false).notNull(),
  },
  (table) => [
    index("deals_status_idx").on(table.status),
    index("deals_retailer_idx").on(table.retailerId),
    index("deals_category_idx").on(table.categoryId),
    index("deals_scraped_at_idx").on(table.scrapedAt),
  ],
);
