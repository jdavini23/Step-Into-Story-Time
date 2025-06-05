
import type { Express } from "express";
import { isAuthenticated } from "../replitAuth";
import { updateUserSubscription, getUserTier, getUserWeeklyUsage } from "../tierManager";
import { storage } from "../storage";
import { db } from "../db";
import { usageTracking } from "../../shared/schema";
import { eq, and } from "drizzle-orm";

export function debugRoutes(app: Express) {
  // Debug auth configuration
  app.get("/api/debug/auth-config", (req, res) => {
    const passport = require('passport');
    res.json({
      hostname: req.hostname,
      headers: {
        host: req.headers.host,
        'x-forwarded-host': req.headers['x-forwarded-host']
      },
      environment: {
        REPL_ID: process.env.REPL_ID,
        REPL_OWNER: process.env.REPL_OWNER,
        REPLIT_DOMAINS: process.env.REPLIT_DOMAINS,
        REPLIT_DEV_DOMAIN: process.env.REPLIT_DEV_DOMAIN,
        NODE_ENV: process.env.NODE_ENV
      },
      availableStrategies: Object.keys(passport._strategies || {}),
      targetStrategy: `replitauth:${req.hostname}`
    });
  });

  // Force set user tier for testing
  app.post("/api/debug/set-tier", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tier, status = "active" } = req.body;

      if (!["free", "premium", "family"].includes(tier)) {
        return res.status(400).json({ message: "Invalid tier" });
      }

      await updateUserSubscription(userId, tier, status);

      res.json({
        message: `User tier set to ${tier}`,
        tier,
        status,
      });
    } catch (error) {
      console.error("Error setting tier:", error);
      res.status(500).json({ message: "Failed to set tier" });
    }
  });

  // Debug user info
  app.get("/api/debug/user-info", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { tier, status } = await getUserTier(userId);
      const weeklyUsage = await getUserWeeklyUsage(userId);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          tier: user.tier,
          subscriptionStatus: user.subscriptionStatus,
          stripeCustomerId: user.stripeCustomerId,
          stripeSubscriptionId: user.stripeSubscriptionId,
        },
        tierInfo: { tier, status },
        weeklyUsage,
      });
    } catch (error) {
      console.error("Error fetching debug user info:", error);
      res.status(500).json({ message: "Failed to fetch user info" });
    }
  });

  // Reset weekly usage
  app.post("/api/debug/reset-usage", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      await db
        .delete(usageTracking)
        .where(eq(usageTracking.userId, userId));

      res.json({ message: "Weekly usage reset successfully" });
    } catch (error) {
      console.error("Error resetting usage:", error);
      res.status(500).json({ message: "Failed to reset usage" });
    }
  });
}
import type { Express } from "express";

export function debugRoutes(app: Express) {
  // Debug endpoint for development
  app.get("/api/debug/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
    });
  });

  // Debug endpoint to check session
  app.get("/api/debug/session", (req: any, res) => {
    if (process.env.NODE_ENV !== "development") {
      return res.status(404).json({ message: "Not found" });
    }

    res.json({
      isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
      user: req.user || null,
      session: req.session || null,
    });
  });
}
