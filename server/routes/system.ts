
import type { Express } from "express";

export function registerSystemRoutes(app: Express): void {
  // Health check endpoint for deployments
  app.get("/health", (req, res) => {
    res.status(200).json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV 
    });
  });
}
