import {
  users,
  stories,
  favorites,
  usageTracking,
  type User,
  type UpsertUser,
  type Story,
  type InsertStory,
  type Favorite,
  type InsertFavorite,
  type UsageTracking,
  type InsertUsageTracking,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import { validateContentSize, FILE_SIZE_LIMITS } from "./fileUtils";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateStripeCustomerId(
    userId: string,
    stripeCustomerId: string,
  ): Promise<User>;
  updateUserStripeInfo(
    userId: string,
    stripeCustomerId: string,
    stripeSubscriptionId: string | null,
  ): Promise<User>;
  updateUserSubscription(
    userId: string,
    tier: string,
    status: string,
  ): Promise<User>;

  // Story operations
  createStory(userId: string, story: InsertStory): Promise<Story>;
  getUserStories(userId: string): Promise<Story[]>;
  getStory(id: number, userId: string): Promise<Story | undefined>;
  updateStory(
    id: number,
    userId: string,
    updates: Partial<InsertStory>,
  ): Promise<Story | undefined>;
  deleteStory(id: number, userId: string): Promise<boolean>;

  // Favorite operations
  addFavorite(userId: string, storyId: number): Promise<Favorite>;
  removeFavorite(userId: string, storyId: number): Promise<boolean>;
  getUserFavorites(userId: string): Promise<Story[]>;
  isStoryFavorited(userId: string, storyId: number): Promise<boolean>;

  // Usage tracking operations
  getUserWeeklyUsage(
    userId: string,
    weekStart: Date,
  ): Promise<UsageTracking | undefined>;
  createUsageTracking(userId: string, weekStart: Date): Promise<UsageTracking>;
  incrementWeeklyUsage(userId: string, weekStart: Date): Promise<UsageTracking>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Story operations
  async createStory(userId: string, story: InsertStory): Promise<Story> {
    // Validate content sizes before insertion
    validateContentSize(
      story.title,
      FILE_SIZE_LIMITS.maxTitleSize,
      "Story title",
    );
    validateContentSize(
      story.content,
      FILE_SIZE_LIMITS.maxStoryContentSize,
      "Story content",
    );

    if (story.bedtimeMessage) {
      validateContentSize(story.bedtimeMessage, 500, "Bedtime message");
    }

    const [newStory] = await db
      .insert(stories)
      .values({
        ...story,
        userId,
      })
      .returning();
    return newStory;
  }

  async getUserStories(userId: string): Promise<Story[]> {
    return await db
      .select()
      .from(stories)
      .where(eq(stories.userId, userId))
      .orderBy(desc(stories.createdAt));
  }

  async getStory(id: number, userId: string): Promise<Story | undefined> {
    const [story] = await db
      .select()
      .from(stories)
      .where(and(eq(stories.id, id), eq(stories.userId, userId)));
    return story;
  }

  async updateStory(
    id: number,
    userId: string,
    updates: Partial<InsertStory>,
  ): Promise<Story | undefined> {
    const [updatedStory] = await db
      .update(stories)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(eq(stories.id, id), eq(stories.userId, userId)))
      .returning();
    return updatedStory;
  }

  async deleteStory(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(stories)
      .where(and(eq(stories.id, id), eq(stories.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  // Favorite operations
  async addFavorite(userId: string, storyId: number): Promise<Favorite> {
    const [favorite] = await db
      .insert(favorites)
      .values({
        userId,
        storyId,
      })
      .onConflictDoNothing()
      .returning();
    return favorite;
  }

  async removeFavorite(userId: string, storyId: number): Promise<boolean> {
    const result = await db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.storyId, storyId)));
    return (result.rowCount || 0) > 0;
  }

  async getUserFavorites(userId: string): Promise<Story[]> {
    const result = await db
      .select({
        id: stories.id,
        userId: stories.userId,
        title: stories.title,
        content: stories.content,
        childName: stories.childName,
        childAge: stories.childAge,
        childGender: stories.childGender,
        favoriteThemes: stories.favoriteThemes,
        tone: stories.tone,
        length: stories.length,
        bedtimeMessage: stories.bedtimeMessage,
        createdAt: stories.createdAt,
        updatedAt: stories.updatedAt,
      })
      .from(stories)
      .innerJoin(favorites, eq(stories.id, favorites.storyId))
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));
    return result;
  }

  async isStoryFavorited(userId: string, storyId: number): Promise<boolean> {
    const [favorite] = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.storyId, storyId)));
    return !!favorite;
  }

  // Stripe payment operations
  async updateStripeCustomerId(
    userId: string,
    stripeCustomerId: string,
  ): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ stripeCustomerId })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserStripeInfo(
    userId: string,
    stripeCustomerId: string,
    stripeSubscriptionId: string | null,
  ): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ stripeCustomerId, stripeSubscriptionId })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserSubscription(
    userId: string,
    tier: string,
    status: string,
  ): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        subscriptionTier: tier,
        subscriptionStatus: status,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Usage tracking operations
  async getUserWeeklyUsage(
    userId: string,
    weekStart: Date,
  ): Promise<UsageTracking | undefined> {
    const [usage] = await db
      .select()
      .from(usageTracking)
      .where(
        and(
          eq(usageTracking.userId, userId),
          eq(usageTracking.weekStart, weekStart),
        ),
      )
      .limit(1);
    return usage;
  }

  async createUsageTracking(
    userId: string,
    weekStart: Date,
  ): Promise<UsageTracking> {
    const [usage] = await db
      .insert(usageTracking)
      .values({
        userId,
        weekStart,
        storiesGenerated: 0,
      })
      .returning();
    return usage;
  }

  async incrementWeeklyUsage(
    userId: string,
    weekStart: Date,
  ): Promise<UsageTracking> {
    // First, get current usage
    let usage = await this.getUserWeeklyUsage(userId, weekStart);

    if (!usage) {
      // Create new usage record if doesn't exist
      usage = await this.createUsageTracking(userId, weekStart);
    }

    // Increment the count
    const [updatedUsage] = await db
      .update(usageTracking)
      .set({
        storiesGenerated: (usage.storiesGenerated || 0) + 1,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(usageTracking.userId, userId),
          eq(usageTracking.weekStart, weekStart),
        ),
      )
      .returning();

    return updatedUsage;
  }
}

export const storage = new DatabaseStorage();