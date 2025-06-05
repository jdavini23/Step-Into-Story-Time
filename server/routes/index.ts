
import type { Express } from "express";
import { authRoutes } from "./auth";
import { favoriteRoutes } from "./favorites";
import { storiesRoutes } from "./stories";
import { paymentsRoutes } from "./payments";
import { debugRoutes } from "./debug";

export function registerRoutes(app: Express) {
  // Register all route modules
  authRoutes(app);
  favoriteRoutes(app);
  storiesRoutes(app);
  paymentsRoutes(app);
  debugRoutes(app);
  
  return app;
}
