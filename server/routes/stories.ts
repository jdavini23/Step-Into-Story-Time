
import type { Express } from "express";
import { isAuthenticated } from "../replitAuth";
import { storage } from "../storage";
import { 
  checkStoryGenerationPermissions,
  validateStoryParameters
} from "../tierMiddleware";
import {
  sanitizedStorySchema,
  validateInput,
  validateCSRFToken,
  RateLimiter
} from "../inputValidation";
import {
  AppError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  DatabaseError,
  asyncHandler
} from "../errorHandler";
import { incrementWeeklyUsage, getUserTier } from "../tierManager";
import { generateBedtimeStory } from "../openai";
import { generateStoryPDF, generateEnhancedPDF } from "../pdfGenerator";
import { z } from "zod";

const storyGenerationLimiter = new RateLimiter(5, 60000); // 5 requests per minute
const generalLimiter = new RateLimiter(30, 60000); // 30 requests per minute

export function storiesRoutes(app: Express) {
  // Story generation endpoint
  app.post(
    "/api/stories/generate",
    isAuthenticated,
    validateCSRFToken,
    (req: any, res, next) => {
      const userId = req.user.claims.sub;
      if (!storyGenerationLimiter.isAllowed(userId)) {
        throw new RateLimitError("Too many story generation requests. Please wait a moment.");
      }
      next();
    },
    checkStoryGenerationPermissions,
    validateStoryParameters,
    validateInput(sanitizedStorySchema.omit({ title: true, content: true })),
    asyncHandler(async (req: any, res) => {
      const userId = req.user.claims.sub;
      const storyData = req.validatedBody;

      try {
        const generatedStory = await generateBedtimeStory({
          childName: storyData.childName,
          childAge: storyData.childAge,
          childGender: storyData.childGender,
          favoriteThemes: storyData.favoriteThemes || undefined,
          tone: storyData.tone,
          length: storyData.length,
          bedtimeMessage: storyData.bedtimeMessage || undefined,
        });

        const story = await storage.createStory(userId, {
          ...storyData,
          title: generatedStory.title,
          content: generatedStory.content,
        });

        if (req.userTier === "free") {
          await incrementWeeklyUsage(userId);
        }

        res.json({
          success: true,
          data: {
            ...story,
            userTier: req.userTier,
            tierLimits: req.tierLimits,
          },
        });
      } catch (error: any) {
        if (error.message?.includes('OpenAI')) {
          throw new AppError('Story generation service is temporarily unavailable', 503, 'SERVICE_UNAVAILABLE');
        }
        if (error.message?.includes('database') || error.message?.includes('storage')) {
          throw new DatabaseError('Failed to save story');
        }
        throw new AppError('Failed to generate story', 500, 'GENERATION_ERROR');
      }
    })
  );

  // Get user's stories with tier-based restrictions
  app.get("/api/stories", isAuthenticated, asyncHandler(async (req: any, res) => {
    const userId = req.user.claims.sub;
    
    try {
      const { tier, status } = await getUserTier(userId);
      let stories = await storage.getUserStories(userId);

      if (tier === "free") {
        stories = stories
          .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          })
          .slice(0, 3);
      } else {
        stories = stories.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
      }

      res.json({
        success: true,
        data: stories,
        meta: {
          count: stories.length,
          tier,
          status,
          hasMore: tier === "free" && stories.length === 3
        }
      });
    } catch (error: any) {
      if (error.message?.includes('database')) {
        throw new DatabaseError('Failed to retrieve stories');
      }
      throw new AppError('Failed to fetch stories', 500, 'FETCH_ERROR');
    }
  }));

  // Get specific story
  app.get("/api/stories/:id", isAuthenticated, asyncHandler(async (req: any, res) => {
    const userId = req.user.claims.sub;
    const storyId = parseInt(req.params.id);

    if (isNaN(storyId) || storyId <= 0) {
      throw new ValidationError("Invalid story ID provided");
    }

    try {
      const story = await storage.getStory(storyId, userId);

      if (!story) {
        throw new NotFoundError("Story");
      }

      // Debug logging for content issues
      console.log(`Story ${storyId} content debug:`, {
        hasContent: !!story.content,
        contentType: typeof story.content,
        contentLength: story.content?.length || 0,
        contentPreview: story.content ? String(story.content).substring(0, 100) + '...' : 'No content',
        isString: typeof story.content === 'string',
        isEmptyString: story.content === '',
        isNull: story.content === null,
        isUndefined: story.content === undefined
      });

      // Ensure content is properly formatted and not empty
      if (story.content && typeof story.content !== 'string') {
        console.log(`Converting story ${storyId} content from ${typeof story.content} to string`);
        story.content = String(story.content);
      }
      
      // Additional check for empty content
      if (!story.content || String(story.content).trim() === '') {
        console.warn(`Story ${storyId} has empty or missing content!`);
      }

      // Create response object and debug it before sending
      const responseData = {
        success: true,
        data: story
      };

      console.log(`Story ${storyId} response debug:`, {
        hasResponseData: !!responseData.data,
        responseContentExists: !!responseData.data?.content,
        responseContentType: typeof responseData.data?.content,
        responseContentLength: responseData.data?.content?.length || 0,
        responseKeys: Object.keys(responseData.data || {}),
        fullResponseSize: JSON.stringify(responseData).length
      });

      res.json(responseData);
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      if (error.message?.includes('database')) {
        throw new DatabaseError('Failed to retrieve story');
      }
      throw new AppError('Failed to fetch story', 500, 'FETCH_ERROR');
    }
  }));

  // Download story as PDF (Premium feature)
  app.get("/api/stories/:id/pdf", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const storyId = parseInt(req.params.id);

      if (isNaN(storyId)) {
        return res.status(400).json({ message: "Invalid story ID" });
      }

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
    (req: any, res, next) => {
      const userId = req.user.claims.sub;
      if (!generalLimiter.isAllowed(`update_${userId}`)) {
        return res.status(429).json({ 
          message: "Too many update requests. Please wait a moment." 
        });
      }
      next();
    },
    validateCSRFToken,
    validateInput(sanitizedStorySchema.partial()),
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const storyId = parseInt(req.params.id);

        if (isNaN(storyId)) {
          return res.status(400).json({ message: "Invalid story ID" });
        }

        const updateData = req.validatedBody;
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
