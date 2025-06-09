
import type { Express } from "express";
import { isAuthenticated } from "../replitAuth";
import { storage } from "../storage";
import { getUserTier, canUserGenerateStory, getUserWeeklyUsage } from "../tierManager";
import { addTierInfoToResponse } from "../tierMiddleware";
import { generateCSRFToken, sanitizeText } from "../inputValidation";

export function registerAuthRoutes(app: Express): void {
  // CSRF token endpoint
  app.get("/api/csrf-token", isAuthenticated, (req: any, res) => {
    const token = generateCSRFToken();
    req.session.csrfToken = token;
    res.json({ csrfToken: token });
  });

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      // Sanitize user data before sending
      const sanitizedUser = {
        ...user,
        firstName: user.firstName ? sanitizeText(user.firstName) : null,
        lastName: user.lastName ? sanitizeText(user.lastName) : null,
        email: user.email ? sanitizeText(user.email) : null,
      };

      res.json(sanitizedUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get user tier and usage information
  app.get(
    "/api/user/tier-info",
    isAuthenticated,
    addTierInfoToResponse,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;

        const { tier, status } = await getUserTier(userId);
        const permissionCheck = await canUserGenerateStory(userId);
        const weeklyUsage = await getUserWeeklyUsage(userId);

        res.json({
          tier,
          status,
          canGenerate: permissionCheck.canGenerate,
          reason: permissionCheck.reason,
          storiesRemaining: permissionCheck.storiesRemaining,
          weeklyUsage: weeklyUsage.storiesGenerated,
          weekStart: weeklyUsage.weekStart,
          limits: req.tierLimits,
        });
      } catch (error) {
        console.error("Error fetching tier info:", error);
        res.status(500).json({ message: "Failed to fetch tier information" });
      }
    },
  );
}
