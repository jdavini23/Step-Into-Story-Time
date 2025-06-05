import type { Express } from "express";
import { isAuthenticated } from "../replitAuth";
import { 
  validateCSRFToken, 
  generateCSRFToken,
  sanitizeText 
} from "../inputValidation";
import { storage } from "../storage";
import { 
  getUserTier, 
  canUserGenerateStory, 
  getUserWeeklyUsage 
} from "../tierManager";
import { addTierInfoToResponse } from "../tierMiddleware";

export function authRoutes(app: Express) {
  // CSRF token endpoint
  app.get("/api/csrf-token", isAuthenticated, (req: any, res) => {
    try {
      if (!req.session) {
        console.warn("No session found when requesting CSRF token");
        return res.status(500).json({ 
          error: "Session not initialized",
          message: "Please refresh the page and try again" 
        });
      }

      const token = generateCSRFToken();
      req.session.csrfToken = token;

      req.session.save((err: any) => {
        if (err) {
          console.error("Failed to save session with CSRF token:", err);
          return res.status(500).json({ 
            error: "Failed to save security token",
            message: "Please try again" 
          });
        }
        res.json({ csrfToken: token });
      });
    } catch (error) {
      console.error("CSRF token generation error:", error);
      res.status(500).json({ 
        error: "Failed to generate CSRF token",
        message: "Internal server error" 
      });
    }
  });

  // Get current user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

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
    }
  );
}