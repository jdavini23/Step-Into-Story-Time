import type { Express } from "express";
import { isAuthenticated } from "./replitAuth";
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

export function registerDebugRoutes(app: Express) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  // Force set user tier for testing
  app.post("/api/debug/set-tier", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tier, status = "active" } = req.body;

      if (!["free", "premium", "family"].includes(tier)) {
        return res.status(400).json({ message: "Invalid tier" });
      }

      await updateUserSubscription(userId, tier, status);
      res.json({ message: `User tier set to ${tier}`, tier, status });
    } catch (error) {
      console.error("Error setting tier:", error);
      res.status(500).json({ message: "Failed to set tier" });
    }
  });

  // Reset weekly usage for testing
  app.post("/api/debug/reset-usage", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const weekStart = getCurrentWeekStart();

      await db
        .update(usageTracking)
        .set({ storiesGenerated: 0, updatedAt: new Date() })
        .where(
          and(
            eq(usageTracking.userId, userId),
            eq(usageTracking.weekStart, weekStart),
          ),
        );

      res.json({ message: "Weekly usage reset" });
    } catch (error) {
      console.error("Error resetting usage:", error);
      res.status(500).json({ message: "Failed to reset usage" });
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
  app.get("/api/debug/auth", isAuthenticated, async (req, res) => {
    const user = req.user as any;

    res.json({
      isAuthenticated: req.isAuthenticated(),
      user: {
        claims: user?.claims,
        expires_at: user?.expires_at,
        hasRefreshToken: !!user?.refresh_token,
      },
      session: {
        id: req.sessionID,
        cookie: req.session.cookie,
      },
    });
  });

  app.get("/api/debug/subscription", isAuthenticated, async (req, res) => {
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
