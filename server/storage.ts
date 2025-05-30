import {
  users,
  stories,
  type User,
  type UpsertUser,
  type Story,
  type InsertStory,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Story operations
  createStory(userId: string, story: InsertStory): Promise<Story>;
  getUserStories(userId: string): Promise<Story[]>;
  getStory(id: number, userId: string): Promise<Story | undefined>;
  updateStory(id: number, userId: string, updates: Partial<InsertStory>): Promise<Story | undefined>;
  deleteStory(id: number, userId: string): Promise<boolean>;
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
      .where(eq(stories.id, id))
      .where(eq(stories.userId, userId));
    return story;
  }

  async updateStory(id: number, userId: string, updates: Partial<InsertStory>): Promise<Story | undefined> {
    const [updatedStory] = await db
      .update(stories)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(stories.id, id))
      .where(eq(stories.userId, userId))
      .returning();
    return updatedStory;
  }

  async deleteStory(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(stories)
      .where(eq(stories.id, id))
      .where(eq(stories.userId, userId));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
