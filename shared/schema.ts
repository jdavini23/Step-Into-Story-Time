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

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
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

// Stories table
export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
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
      .references(() => users.id),
    storyId: integer("story_id")
      .notNull()
      .references(() => stories.id),
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
      .references(() => users.id),
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
    .references(() => users.id),
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
