import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Legacy session storage table (connect-pg-simple) — kept for backward compat, not used by better-auth.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (extended for better-auth).
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  // better-auth required fields
  name: varchar("name"),
  email: varchar("email").unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: varchar("image"),
  // App-specific fields
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionTier: varchar("subscription_tier").default("free"), // 'free', 'premium', 'family'
  subscriptionStatus: varchar("subscription_status").default("active"), // 'active', 'canceled', 'past_due', etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// better-auth session table (separate from legacy connect-pg-simple sessions table).
export const betterAuthSessions = pgTable("better_auth_sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

// better-auth accounts table (OAuth provider links).
export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"), // BetterAuth-managed password hash (not plaintext)
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

// better-auth verification table (email verification tokens).
export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// Stories table
export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  childName: varchar("child_name").notNull(),
  childAge: integer("child_age").notNull(),
  childGender: varchar("child_gender").notNull(), // 'boy', 'girl'
  favoriteThemes: varchar("favorite_themes"),
  tone: varchar("tone").notNull(), // 'adventurous', 'silly', 'calming', 'educational'
  length: varchar("length").notNull(), // 'short', 'medium', 'long'
  storyTemplate: varchar("story_template"), // Story structure template
  bedtimeMessage: text("bedtime_message"),
  customCharacters: text("custom_characters").array(), // Array of custom character IDs to include
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const insertStorySchema = createInsertSchema(stories).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  customCharacters: z.array(z.string()).optional(),
});

export type InsertStory = z.infer<typeof insertStorySchema>;
export type Story = typeof stories.$inferSelect;

// Favorites table
export const favorites = pgTable(
  "favorites",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    storyId: integer("story_id")
      .notNull()
      .references(() => stories.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    // Ensure a user can only favorite a story once
    index("unique_user_story_favorite").on(table.userId, table.storyId),
  ],
);

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;

// Usage tracking table for monitoring weekly limits
export const usageTracking = pgTable(
  "usage_tracking",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    weekStart: timestamp("week_start").notNull(), // Monday 00:00:00 of the week
    storiesGenerated: integer("stories_generated").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    // Ensure unique tracking per user per week
    index("unique_user_week").on(table.userId, table.weekStart),
  ],
);

export const insertUsageTrackingSchema = createInsertSchema(usageTracking).omit(
  {
    id: true,
    createdAt: true,
    updatedAt: true,
  },
);

export type InsertUsageTracking = z.infer<typeof insertUsageTrackingSchema>;
export type UsageTracking = typeof usageTracking.$inferSelect;

// Custom Characters table
export const customCharacters = pgTable("custom_characters", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  appearance: text("appearance").notNull(), // Physical description
  personality: text("personality").notNull(), // Character traits
  role: varchar("role").notNull(), // friend, pet, mentor, villain, etc.
  species: varchar("species").default("human"), // human, animal, magical creature, etc.
  age: varchar("age"), // young, adult, elderly, etc.
  specialAbilities: text("special_abilities"), // Any magical or special powers
  backstory: text("backstory"), // Character's history
  favoriteThings: text("favorite_things"), // What they like
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCustomCharacterSchema = createInsertSchema(customCharacters).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCustomCharacter = z.infer<typeof insertCustomCharacterSchema>;
export type CustomCharacter = typeof customCharacters.$inferSelect;

// Chat/Conversations tables
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id")
    .notNull()
    .references(() => conversations.id),
  role: varchar("role").notNull(), // 'user', 'assistant'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;

// Processed Stripe Events table for webhook idempotency
export const processedStripeEvents = pgTable("processed_stripe_events", {
  eventId: varchar("event_id", { length: 255 }).primaryKey(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  processedAt: timestamp("processed_at").defaultNow().notNull(),
});
