import { db } from "./db";
import { users, usageTracking } from "../shared/schema";
import { eq, and, gte } from "drizzle-orm";

export type SubscriptionTier = "free" | "premium" | "family";
export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "unpaid";

export interface TierLimits {
  storiesPerWeek: number | null; // null means unlimited
  maxStoriesInLibrary: number | null; // null means unlimited
  canDownloadPdf: boolean;
  canAccessAllThemes: boolean;
  canAccessAllLengths: boolean;
  maxChildProfiles: number;
  hasAiIllustrations: boolean;
  hasAudioNarration: boolean;
  hasMagicLetters: boolean;
  hasCustomCharacters: boolean;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    storiesPerWeek: 3,
    maxStoriesInLibrary: 3,
    canDownloadPdf: false,
    canAccessAllThemes: false,
    canAccessAllLengths: false,
    maxChildProfiles: 1,
    hasAiIllustrations: false,
    hasAudioNarration: false,
    hasMagicLetters: false,
    hasCustomCharacters: false,
  },
  premium: {
    storiesPerWeek: null,
    maxStoriesInLibrary: null,
    canDownloadPdf: true,
    canAccessAllThemes: true,
    canAccessAllLengths: true,
    maxChildProfiles: 1,
    hasAiIllustrations: true,
    hasAudioNarration: false,
    hasMagicLetters: false,
    hasCustomCharacters: false,
  },
  family: {
    storiesPerWeek: null,
    maxStoriesInLibrary: null,
    canDownloadPdf: true,
    canAccessAllThemes: true,
    canAccessAllLengths: true,
    maxChildProfiles: 5,
    hasAiIllustrations: true,
    hasAudioNarration: true,
    hasMagicLetters: true,
    hasCustomCharacters: true,
  },
};

export const FREE_TIER_THEMES = ["bedtime", "fantasy", "adventure"];
export const FREE_TIER_LENGTHS = ["short"];
export const PREMIUM_TIER_LENGTHS = ["short", "medium", "long"];
export const FAMILY_TIER_LENGTHS = ["short", "medium", "long"];

/**
 * Get the current week start (Monday 00:00:00)
 */
export function getCurrentWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Get user's subscription tier and status
 */
export async function getUserTier(
  userId: string,
): Promise<{ tier: SubscriptionTier; status: SubscriptionStatus }> {
  const user = await db
    .select({
      subscriptionTier: users.subscriptionTier,
      subscriptionStatus: users.subscriptionStatus,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user.length) {
    throw new Error("User not found");
  }

  return {
    tier: (user[0].subscriptionTier as SubscriptionTier) || "free",
    status: (user[0].subscriptionStatus as SubscriptionStatus) || "active",
  };
}

/**
 * Get or create usage tracking for current week
 */
export async function getUserWeeklyUsage(
  userId: string,
): Promise<{ storiesGenerated: number; weekStart: Date }> {
  const weekStart = getCurrentWeekStart();

  // Try to get existing usage record
  const existingUsage = await db
    .select()
    .from(usageTracking)
    .where(
      and(
        eq(usageTracking.userId, userId),
        eq(usageTracking.weekStart, weekStart),
      ),
    )
    .limit(1);

  if (existingUsage.length > 0) {
    return {
      storiesGenerated: existingUsage[0].storiesGenerated || 0,
      weekStart,
    };
  }

  // Create new usage record for this week
  await db.insert(usageTracking).values({
    userId,
    weekStart,
    storiesGenerated: 0,
  });

  return {
    storiesGenerated: 0,
    weekStart,
  };
}

/**
 * Increment user's weekly story count
 */
export async function incrementWeeklyUsage(userId: string): Promise<number> {
  const weekStart = getCurrentWeekStart();

  // Get current usage
  const usage = await getUserWeeklyUsage(userId);

  // Update the count
  const newCount = usage.storiesGenerated + 1;

  await db
    .update(usageTracking)
    .set({
      storiesGenerated: newCount,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(usageTracking.userId, userId),
        eq(usageTracking.weekStart, weekStart),
      ),
    );

  return newCount;
}

/**
 * Check if user can generate a story based on their tier and usage
 */
export async function canUserGenerateStory(userId: string): Promise<{
  canGenerate: boolean;
  reason?: string;
  storiesRemaining?: number;
}> {
  const { tier, status } = await getUserTier(userId);

  // Check if subscription is active (for paid tiers)
  if (tier !== "free" && status !== "active" && status !== "trialing") {
    return {
      canGenerate: false,
      reason: "Subscription is not active",
    };
  }

  const limits = TIER_LIMITS[tier];

  // If unlimited (premium/family), allow generation
  if (limits.storiesPerWeek === null) {
    return { canGenerate: true };
  }

  // For free tier, check weekly limit
  const usage = await getUserWeeklyUsage(userId);
  const storiesRemaining = limits.storiesPerWeek - usage.storiesGenerated;

  if (storiesRemaining <= 0) {
    return {
      canGenerate: false,
      reason: "Weekly story limit reached",
      storiesRemaining: 0,
    };
  }

  return {
    canGenerate: true,
    storiesRemaining,
  };
}

/**
 * Update user's subscription tier and status
 */
export async function updateUserSubscription(
  userId: string,
  tier: SubscriptionTier,
  status: SubscriptionStatus,
): Promise<void> {
  await db
    .update(users)
    .set({
      subscriptionTier: tier,
      subscriptionStatus: status,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

/**
 * Validate if user can access specific themes
 */
export function canAccessTheme(
  userTier: SubscriptionTier,
  theme: string,
): boolean {
  const limits = TIER_LIMITS[userTier];

  if (limits.canAccessAllThemes) {
    return true;
  }

  return FREE_TIER_THEMES.includes(theme.toLowerCase());
}

/**
 * Validate if user can access specific story lengths
 */
export function canAccessLength(
  userTier: SubscriptionTier,
  length: string,
): boolean {
  const limits = TIER_LIMITS[userTier];

  if (limits.canAccessAllLengths) {
    return true;
  }

  // Map tiers to their allowed lengths
  const allowedLengths = {
    free: FREE_TIER_LENGTHS,
    premium: PREMIUM_TIER_LENGTHS,
    family: FAMILY_TIER_LENGTHS,
  };

  return allowedLengths[userTier].includes(length.toLowerCase());
}
