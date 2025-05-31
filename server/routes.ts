import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertStorySchema } from "@shared/schema";
import { generateBedtimeStory } from "./openai";
import { z } from "zod";

// Create a schema for story generation requests (without title and content)
const storyGenerationRequestSchema = insertStorySchema.omit({ 
  title: true, 
  content: true 
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Story generation endpoint
  app.post("/api/stories/generate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      console.log("Request body:", req.body);
      console.log("Request schema fields:", Object.keys(storyGenerationRequestSchema.shape));
      
      // Validate request body (excluding title and content which are generated)
      const storyData = storyGenerationRequestSchema.parse(req.body);
      
      // Generate story using OpenAI
      const generatedStory = await generateBedtimeStory({
        childName: storyData.childName,
        childAge: storyData.childAge,
        childGender: storyData.childGender,
        favoriteThemes: storyData.favoriteThemes || undefined,
        tone: storyData.tone,
        length: storyData.length,
        bedtimeMessage: storyData.bedtimeMessage || undefined,
      });
      
      // Save story to database
      const story = await storage.createStory(userId, {
        ...storyData,
        title: generatedStory.title,
        content: generatedStory.content,
      });
      
      res.json(story);
    } catch (error) {
      console.error("Error generating story:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid story parameters", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to generate story" });
      }
    }
  });

  // Get user's stories
  app.get("/api/stories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stories = await storage.getUserStories(userId);
      res.json(stories);
    } catch (error) {
      console.error("Error fetching stories:", error);
      res.status(500).json({ message: "Failed to fetch stories" });
    }
  });

  // Get specific story
  app.get("/api/stories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const storyId = parseInt(req.params.id);
      
      if (isNaN(storyId)) {
        return res.status(400).json({ message: "Invalid story ID" });
      }
      
      const story = await storage.getStory(storyId, userId);
      
      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }
      
      res.json(story);
    } catch (error) {
      console.error("Error fetching story:", error);
      res.status(500).json({ message: "Failed to fetch story" });
    }
  });

  // Update story
  app.patch("/api/stories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const storyId = parseInt(req.params.id);
      
      if (isNaN(storyId)) {
        return res.status(400).json({ message: "Invalid story ID" });
      }
      
      // Validate partial update data
      const updateData = insertStorySchema.partial().parse(req.body);
      
      const story = await storage.updateStory(storyId, userId, updateData);
      
      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }
      
      res.json(story);
    } catch (error) {
      console.error("Error updating story:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid update data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update story" });
      }
    }
  });

  // Delete story
  app.delete("/api/stories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const storyId = parseInt(req.params.id);
      
      if (isNaN(storyId)) {
        return res.status(400).json({ message: "Invalid story ID" });
      }
      
      const deleted = await storage.deleteStory(storyId, userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Story not found" });
      }
      
      res.json({ message: "Story deleted successfully" });
    } catch (error) {
      console.error("Error deleting story:", error);
      res.status(500).json({ message: "Failed to delete story" });
    }
  });

  // Add story to favorites
  app.post("/api/favorites/:storyId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const storyId = parseInt(req.params.storyId);
      
      if (isNaN(storyId)) {
        return res.status(400).json({ message: "Invalid story ID" });
      }
      
      // Check if story exists and belongs to user
      const story = await storage.getStory(storyId, userId);
      if (!story) {
        return res.status(404).json({ message: "Story not found" });
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

  const httpServer = createServer(app);
  return httpServer;
}
