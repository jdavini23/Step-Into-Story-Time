import type { Express } from "express";
import { isAuthenticated } from "../authMiddleware";
import { storage } from "../storage";
import { validateInput, validateCSRFToken, type RateLimiter } from "../inputValidation";
import { insertCustomCharacterSchema } from "../../shared/schema";
import { getUserTier } from "../tierManager";
import { z } from "zod";

export function registerCharacterRoutes(app: Express, generalLimiter: RateLimiter): void {
  
  // Get user's custom characters
  app.get("/api/characters", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if user has access to custom characters
      const { tier } = await getUserTier(userId);
      if (tier !== "family") {
        return res.status(403).json({ 
          message: "Custom characters are only available with Storytime Pro plan" 
        });
      }

      const characters = await storage.getUserCustomCharacters(userId);
      res.json(characters);
    } catch (error) {
      console.error("Error fetching custom characters:", error);
      res.status(500).json({ message: "Failed to fetch custom characters" });
    }
  });

  // Create a new custom character
  app.post(
    "/api/characters",
    isAuthenticated,
    validateCSRFToken,
    (req: any, res, next) => {
      const userId = req.user.claims.sub;
      if (!generalLimiter.isAllowed(userId)) {
        return res.status(429).json({ 
          message: "Too many requests. Please wait a moment.",
          retryAfter: 60
        });
      }
      next();
    },
    validateInput(insertCustomCharacterSchema),
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        
        // Check if user has access to custom characters
        const { tier } = await getUserTier(userId);
        if (tier !== "family") {
          return res.status(403).json({ 
            message: "Custom characters are only available with Storytime Pro plan" 
          });
        }

        const characterData = req.validatedBody;
        const newCharacter = await storage.createCustomCharacter(userId, characterData);
        
        res.status(201).json(newCharacter);
      } catch (error) {
        console.error("Error creating custom character:", error);
        res.status(500).json({ message: "Failed to create custom character" });
      }
    }
  );

  // Get a specific custom character
  app.get("/api/characters/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const characterId = parseInt(req.params.id);
      
      if (isNaN(characterId)) {
        return res.status(400).json({ message: "Invalid character ID" });
      }

      // Check if user has access to custom characters
      const { tier } = await getUserTier(userId);
      if (tier !== "family") {
        return res.status(403).json({ 
          message: "Custom characters are only available with Storytime Pro plan" 
        });
      }

      const character = await storage.getCustomCharacter(characterId, userId);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }

      res.json(character);
    } catch (error) {
      console.error("Error fetching custom character:", error);
      res.status(500).json({ message: "Failed to fetch custom character" });
    }
  });

  // Update a custom character
  app.patch(
    "/api/characters/:id",
    isAuthenticated,
    validateCSRFToken,
    validateInput(insertCustomCharacterSchema.partial()),
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const characterId = parseInt(req.params.id);
        
        if (isNaN(characterId)) {
          return res.status(400).json({ message: "Invalid character ID" });
        }

        // Check if user has access to custom characters
        const { tier } = await getUserTier(userId);
        if (tier !== "family") {
          return res.status(403).json({ 
            message: "Custom characters are only available with Storytime Pro plan" 
          });
        }

        const updates = req.validatedBody;
        const updatedCharacter = await storage.updateCustomCharacter(characterId, userId, updates);
        
        if (!updatedCharacter) {
          return res.status(404).json({ message: "Character not found" });
        }

        res.json(updatedCharacter);
      } catch (error) {
        console.error("Error updating custom character:", error);
        res.status(500).json({ message: "Failed to update custom character" });
      }
    }
  );

  // Delete a custom character
  app.delete("/api/characters/:id", isAuthenticated, validateCSRFToken, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const characterId = parseInt(req.params.id);
      
      if (isNaN(characterId)) {
        return res.status(400).json({ message: "Invalid character ID" });
      }

      // Check if user has access to custom characters
      const { tier } = await getUserTier(userId);
      if (tier !== "family") {
        return res.status(403).json({ 
          message: "Custom characters are only available with Storytime Pro plan" 
        });
      }

      const deleted = await storage.deleteCustomCharacter(characterId, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Character not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting custom character:", error);
      res.status(500).json({ message: "Failed to delete custom character" });
    }
  });
}