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
  referralParam: text("referral_param"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Store Listings ───────────────────────────────────────────────────────────
export const storeListings = pgTable("store_listings", {
  id: uuid("id").defaultRandom().primaryKey(),
  gameId: uuid("game_id").references(() => games.id).notNull(),
  storeId: uuid("store_id").references(() => stores.id).notNull(),
  storeUrl: text("store_url").notNull(),
  storeGameId: varchar("store_game_id", { length: 255 }),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  isAllTimeLow: boolean("is_all_time_low").default(false).notNull(),
  expiresAt: timestamp("expires_at"),
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
  saleEndsAt: timestamp("sale_ends_at"),
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

// ─── Store Listing Stats ──────────────────────────────────────────────────────
export const storeListingStats = pgTable("store_listing_stats", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeListingId: uuid("store_listing_id").references(() => storeListings.id).notNull(),
  allTimeLowPrice: decimal("all_time_low_price", { precision: 10, scale: 2 }),
  allTimeLowDiscount: decimal("all_time_low_discount", { precision: 5, scale: 2 }),
  avg30DayPrice: decimal("avg_30_day_price", { precision: 10, scale: 2 }),
  avg90DayPrice: decimal("avg_90_day_price", { precision: 10, scale: 2 }),
  isAllTimeLow: boolean("is_all_time_low").default(false).notNull(),
  allTimeLowLastSeenAt: timestamp("all_time_low_last_seen_at"),
  dealScore: decimal("deal_score", { precision: 5, scale: 2 }),
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
