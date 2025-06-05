
import type { Express } from "express";
import { isAuthenticated } from "../replitAuth";
import { storage } from "../storage";

export function favoriteRoutes(app: Express) {
  // Add story to favorites
  app.post("/api/favorites/:storyId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const storyId = parseInt(req.params.storyId);

      if (isNaN(storyId)) {
        return res.status(400).json({ message: "Invalid story ID" });
      }

      const story = await storage.getStory(storyId, userId);
      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }

      const isAlreadyFavorited = await storage.isStoryFavorited(userId, storyId);
      if (isAlreadyFavorited) {
        return res.status(200).json({ message: "Story is already favorited" });
      }

      const favorite = await storage.addFavorite(userId, storyId);
      res.json(favorite);
    } catch (error) {
      console.error("Error adding favorite:", error);
      res.status(500).json({ message: "Failed to add favorite" });
    }
  });

  // Remove story from favorites
  app.delete("/api/favorites/:storyId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const storyId = parseInt(req.params.storyId);

      if (isNaN(storyId)) {
        return res.status(400).json({ message: "Invalid story ID" });
      }

      const removed = await storage.removeFavorite(userId, storyId);

      if (!removed) {
        return res.status(404).json({ message: "Favorite not found" });
      }

      res.json({ message: "Favorite removed successfully" });
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  // Get user's favorite stories
  app.get("/api/favorites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favorites = await storage.getUserFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  // Check if story is favorited
  app.get("/api/favorites/:storyId/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const storyId = parseInt(req.params.storyId);

      if (isNaN(storyId)) {
        return res.status(400).json({ message: "Invalid story ID" });
      }

      const isFavorited = await storage.isStoryFavorited(userId, storyId);
      res.json({ isFavorited });
    } catch (error) {
      console.error("Error checking favorite status:", error);
      res.status(500).json({ message: "Failed to check favorite status" });
    }
  });
}
