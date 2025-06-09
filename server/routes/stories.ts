
import type { Express } from "express";
import { isAuthenticated } from "../replitAuth";
import { storage } from "../storage";
import { 
  checkStoryGenerationPermissions,
  validateStoryParameters,
} from "../tierMiddleware";
import {
  sanitizedStorySchema,
  validateInput,
  validateCSRFToken,
  type RateLimiter,
} from "../inputValidation";
import { generateBedtimeStory } from "../openai";
import { generateStoryPDF, generateEnhancedPDF } from "../pdfGenerator";
import { incrementWeeklyUsage, getUserTier } from "../tierManager";
import { z } from "zod";

export function registerStoryRoutes(
  app: Express, 
  storyGenerationLimiter: RateLimiter, 
  generalLimiter: RateLimiter
): void {
  
  // Story generation endpoint
  app.post(
    "/api/stories/generate",
    isAuthenticated,
    validateCSRFToken,
    (req: any, res, next) => {
      // Rate limiting for story generation
      const userId = req.user.claims.sub;
      if (!storyGenerationLimiter.isAllowed(userId)) {
        return res.status(429).json({ 
          message: "Too many story generation requests. Please wait a moment.",
          retryAfter: 60
        });
      }
      next();
    },
    checkStoryGenerationPermissions,
    validateStoryParameters,
    validateInput(sanitizedStorySchema.omit({ title: true, content: true })),
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const storyData = req.validatedBody;

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

        // Track usage for free users
        if (req.userTier === "free") {
          await incrementWeeklyUsage(userId);
        }

        res.json({
          ...story,
          userTier: req.userTier,
          tierLimits: req.tierLimits,
        });
      } catch (error) {
        console.error("Error generating story:", error);
        if (error instanceof z.ZodError) {
          res.status(400).json({
            message: "Invalid story parameters",
            errors: error.errors,
          });
        } else {
          res.status(500).json({ message: "Failed to generate story" });
        }
      }
    },
  );

  // Get user's stories with tier-based restrictions
  app.get("/api/stories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tier } = await getUserTier(userId);
      let stories = await storage.getUserStories(userId);

      // Apply story library restrictions for free users
      if (tier === "free") {
        // Sort by creation date (newest first) and limit to 3 most recent
        stories = stories
          .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          })
          .slice(0, 3);
      }

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

      console.log(`Fetching story ${storyId} for user ${userId}`);

      if (isNaN(storyId)) {
        console.log(`Invalid story ID provided: ${req.params.id}`);
        return res.status(400).json({ message: "Invalid story ID" });
      }

      const story = await storage.getStory(storyId, userId);

      if (!story) {
        console.log(`Story ${storyId} not found for user ${userId}`);
        return res.status(404).json({ message: "Story not found" });
      }

      console.log(`Successfully fetched story ${storyId} for user ${userId}`);
      res.json(story);
    } catch (error) {
      console.error("Error fetching story:", error);
      res.status(500).json({ message: "Failed to fetch story" });
    }
  });

  // Download story as PDF (Premium feature)
  app.get("/api/stories/:id/pdf", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const storyId = parseInt(req.params.id);

      if (isNaN(storyId)) {
        return res.status(400).json({ message: "Invalid story ID" });
      }

      // Check if user has PDF download access
      const { tier } = await getUserTier(userId);
      if (tier === "free") {
        return res.status(403).json({
          error: "PDF download restricted",
          message: "PDF downloads are available for Premium and Family subscribers only.",
          upgradeRequired: true,
        });
      }

      const story = await storage.getStory(storyId, userId);
      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }

      // Generate PDF based on tier
      const pdfBuffer = tier === "family"
        ? generateEnhancedPDF(story)
        : generateStoryPDF(story);

      const filename = `${story.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // Update story
  app.patch(
    "/api/stories/:id", 
    isAuthenticated,
    validateCSRFToken,
    (req: any, res, next) => {
      // Rate limiting for updates
      const userId = req.user.claims.sub;
      if (!generalLimiter.isAllowed(`update_${userId}`)) {
        return res.status(429).json({ 
          message: "Too many update requests. Please wait a moment." 
        });
      }
      next();
    },
    validateInput(sanitizedStorySchema.partial()),
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const storyId = parseInt(req.params.id);

        if (isNaN(storyId)) {
          return res.status(400).json({ message: "Invalid story ID" });
        }

        // Use validated and sanitized data
        const updateData = req.validatedBody;
        const story = await storage.updateStory(storyId, userId, updateData);

        if (!story) {
          return res.status(404).json({ message: "Story not found" });
        }

        res.json(story);
      } catch (error) {
        console.error("Error updating story:", error);
        if (error instanceof z.ZodError) {
          res.status(400).json({ 
            message: "Invalid update data", 
            errors: error.errors 
          });
        } else {
          res.status(500).json({ message: "Failed to update story" });
        }
      }
    }
  );

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
}
