import type { Express } from "express";
import { isAuthenticated } from "./authMiddleware";
import {
  updateUserSubscription,
  getUserTier,
  getUserWeeklyUsage,
  getCurrentWeekStart,
} from "./tierManager";
import { storage } from "./storage";
import { db } from "./db";
import { usageTracking } from "../shared/schema";
import { eq, and } from "drizzle-orm";

export function registerDebugRoutes(app: Express): void {
  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!isDevelopment) {
    console.log("Debug routes disabled in production");
    return;
  }

  // Get user info for debugging
  app.get("/api/debug/user-info", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      res.json({
        user: user ? {
          id: user.id,
          email: user.email,
          subscriptionTier: user.subscriptionTier,
          subscriptionStatus: user.subscriptionStatus,
          stripeCustomerId: user.stripeCustomerId,
          stripeSubscriptionId: user.stripeSubscriptionId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        } : null,
        claims: req.user.claims,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching debug user info:", error);
      res.status(500).json({ message: "Failed to fetch user info" });
    }
  });

  // Set user tier for testing (debug only)
  app.post("/api/debug/set-tier", isAuthenticated, async (req: any, res) => {
    try {
      console.log(`=== DEBUG SET TIER START ===`);

      const userId = req.user?.claims?.sub;
      const { tier, status = "active" } = req.body;

      console.log(`User ID: ${userId}`);
      console.log(`Requested tier: ${tier}`);
      console.log(`Requested status: ${status}`);
      console.log(`Request user object:`, req.user);

      if (!userId) {
        console.log(`Debug: No user ID found in request`);
        return res.status(401).json({ message: "User not authenticated" });
      }

      if (!tier) {
        console.log(`Debug: No tier provided in request body`);
        return res.status(400).json({ message: "Tier is required" });
      }

      if (!["free", "premium", "family"].includes(tier)) {
        console.log(`Debug: Invalid tier received: ${tier}`);
        return res.status(400).json({ message: `Invalid tier: ${tier}. Must be one of: free, premium, family` });
      }

      if (!["active", "canceled", "past_due", "incomplete", "incomplete_expired", "trialing", "unpaid"].includes(status)) {
        console.log(`Debug: Invalid status received: ${status}`);
        return res.status(400).json({ message: `Invalid status: ${status}` });
      }

      // Check if user exists first
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        console.log(`Debug: User ${userId} not found in database`);
        return res.status(404).json({ message: "User not found" });
      }

      console.log(`Debug: Current user state:`, {
        tier: existingUser.subscriptionTier,
        status: existingUser.subscriptionStatus
      });

      // Update the subscription using the storage layer
      const updatedUser = await storage.updateUserSubscription(userId, tier, status);
      console.log(`Debug: Successfully updated user subscription:`, {
        userId,
        oldTier: existingUser.subscriptionTier,
        newTier: updatedUser.subscriptionTier,
        oldStatus: existingUser.subscriptionStatus,
        newStatus: updatedUser.subscriptionStatus
      });

      console.log(`=== DEBUG SET TIER SUCCESS ===`);

      res.json({ 
        message: `Successfully updated user tier to ${tier} with status ${status}`, 
        tier: updatedUser.subscriptionTier, 
        status: updatedUser.subscriptionStatus,
        userId,
        previousTier: existingUser.subscriptionTier,
        previousStatus: existingUser.subscriptionStatus
      });
    } catch (error) {
      console.error("=== DEBUG SET TIER ERROR ===");
      console.error("Error setting tier:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");

      res.status(500).json({ 
        message: "Failed to set tier", 
        error: error instanceof Error ? error.message : "Unknown error",
        stack: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : undefined) : undefined
      });
    }
  });

  // Reset weekly usage for testing
  app.post("/api/debug/reset-usage", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const weekStart = getCurrentWeekStart();

      console.log(`Debug: Resetting usage for user ${userId} for week starting ${weekStart}`);

      const result = await db
        .update(usageTracking)
        .set({ storiesGenerated: 0, updatedAt: new Date() })
        .where(
          and(
            eq(usageTracking.userId, userId),
            eq(usageTracking.weekStart, weekStart),
          ),
        );

      console.log(`Debug: Reset usage result:`, result);

      res.json({ 
        message: "Weekly usage reset successfully", 
        userId, 
        weekStart: weekStart.toISOString() 
      });
    } catch (error) {
      console.error("Error resetting usage:", error);
      res.status(500).json({ 
        message: "Failed to reset usage", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get debug info
  app.get("/api/debug/user-info", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { tier, status } = await getUserTier(userId);
      const weeklyUsage = await getUserWeeklyUsage(userId);

      res.json({
        user: {
          id: user?.id,
          email: user?.email,
          stripeCustomerId: user?.stripeCustomerId,
          stripeSubscriptionId: user?.stripeSubscriptionId,
        },
        tier,
        status,
        weeklyUsage: weeklyUsage.storiesGenerated,
      });
    } catch (error) {
      console.error("Error getting debug info:", error);
      res.status(500).json({ message: "Failed to get debug info" });
    }
  });

  // Simulate webhook events for testing
  app.post(
    "/api/debug/simulate-webhook",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { eventType, tier = "premium" } = req.body;
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        switch (eventType) {
          case "payment_succeeded":
            await updateUserSubscription(userId, tier, "active");
            res.json({ message: `Simulated payment success for ${tier} tier` });
            break;

          case "subscription_canceled":
            await updateUserSubscription(userId, "free", "canceled");
            res.json({ message: "Simulated subscription cancellation" });
            break;

          case "payment_failed":
            await updateUserSubscription(userId, tier, "past_due");
            res.json({ message: "Simulated payment failure" });
            break;

          default:
            res.status(400).json({ message: "Invalid event type" });
        }
      } catch (error) {
        console.error("Error simulating webhook:", error);
        res.status(500).json({ message: "Failed to simulate webhook" });
      }
    },
  );
}

export function setupDebugRoutes(app: Express) {
  app.get("/api/debug/auth", isAuthenticated, async (req: any, res) => {
    const user = req.user;

    res.json({
      isAuthenticated: !!user,
      user: {
        claims: user?.claims,
      },
    });
  });

  app.get("/api/debug/subscription", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub;

      if (!userId) {
        return res.status(400).json({ error: "No user ID found in claims" });
      }

      // Try to get user data from storage
      const userData = await storage.getUser(userId);

      res.json({
        userId,
        userData,
        claims: user?.claims,
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT SET",
        },
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  });
}