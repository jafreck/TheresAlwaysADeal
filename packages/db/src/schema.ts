import {
  boolean,
  decimal,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// ─── Games ────────────────────────────────────────────────────────────────────
export const games = pgTable("games", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).notNull().unique(),
  description: text("description"),
  headerImageUrl: text("header_image_url"),
  steamAppId: integer("steam_app_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Stores ───────────────────────────────────────────────────────────────────
export const stores = pgTable("stores", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  logoUrl: text("logo_url"),
  baseUrl: text("base_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Store Listings ───────────────────────────────────────────────────────────
export const storeListings = pgTable("store_listings", {
  id: uuid("id").defaultRandom().primaryKey(),
  gameId: uuid("game_id").references(() => games.id).notNull(),
  storeId: uuid("store_id").references(() => stores.id).notNull(),
  storeUrl: text("store_url").notNull(),
  storeGameId: varchar("store_game_id", { length: 255 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Price History ────────────────────────────────────────────────────────────
export const priceHistory = pgTable("price_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeListingId: uuid("store_listing_id").references(() => storeListings.id).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),
  discount: decimal("discount", { precision: 5, scale: 2 }),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  steamId: varchar("steam_id", { length: 100 }),
  steamAccessToken: text("steam_access_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Wishlists ────────────────────────────────────────────────────────────────
export const wishlists = pgTable("wishlists", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  gameId: uuid("game_id").references(() => games.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Price Alerts ─────────────────────────────────────────────────────────────
export const priceAlerts = pgTable("price_alerts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  gameId: uuid("game_id").references(() => games.id).notNull(),
  targetPrice: decimal("target_price", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Alert Notifications ──────────────────────────────────────────────────────
export const alertNotifications = pgTable("alert_notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  alertId: uuid("alert_id").references(() => priceAlerts.id).notNull(),
  storeListingId: uuid("store_listing_id").references(() => storeListings.id).notNull(),
  triggeredPrice: decimal("triggered_price", { precision: 10, scale: 2 }).notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});
