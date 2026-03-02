
import type { Express } from "express";
import { createServer, type Server } from "http";
import { RateLimiter } from "../inputValidation";

// Import route modules
import { registerAuthRoutes } from "./auth";
import { registerStoryRoutes } from "./stories";
import { registerFavoriteRoutes } from "./favorites";
import { registerPaymentRoutes } from "./payments";
import { registerWebhookRoutes } from "./webhooks";
import { registerCharacterRoutes } from "./characters";
import { registerSystemRoutes } from "./system";
import { registerSEORoutes } from "./seo";

// Rate limiters for different endpoints
export const storyGenerationLimiter = new RateLimiter(5, 60000); // 5 requests per minute
export const generalLimiter = new RateLimiter(30, 60000); // 30 requests per minute

export async function registerRoutes(app: Express): Promise<Server> {

  // Register all route modules
  registerSEORoutes(app);
  registerSystemRoutes(app);
  registerAuthRoutes(app);
  registerStoryRoutes(app, storyGenerationLimiter, generalLimiter);
  registerFavoriteRoutes(app);
  registerPaymentRoutes(app, generalLimiter);
  registerWebhookRoutes(app);
  registerCharacterRoutes(app, generalLimiter);

  // Debug endpoints for testing (remove in production)
  if (process.env.NODE_ENV === "development") {
    const { registerDebugRoutes, setupDebugRoutes } = await import("../debugRoutes");
    registerDebugRoutes(app);
    setupDebugRoutes(app);
  }

  const httpServer = createServer(app);
  return httpServer;
}
