import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertStorySchema } from "@shared/schema";
import { generateBedtimeStory } from "./openai";
import {
  checkStoryGenerationPermissions,
  validateStoryParameters,
  addTierInfoToResponse,
} from "./tierMiddleware";
import {
  sanitizedStorySchema,
  validateInput,
  validateCSRFToken,
  generateCSRFToken,
  RateLimiter,
  sanitizeText,
  sanitizeStoryContent,
} from "./inputValidation";
import {
  incrementWeeklyUsage,
  getCurrentWeekStart,
  updateUserSubscription,
  getUserTier,
  canUserGenerateStory,
  getUserWeeklyUsage,
} from "./tierManager";
import { generateStoryPDF, generateEnhancedPDF } from "./pdfGenerator";
import { db } from "./db";
import { users, usageTracking } from "../shared/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing required Stripe secret: STRIPE_SECRET_KEY");
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Rate limiters for different endpoints
const storyGenerationLimiter = new RateLimiter(5, 60000); // 5 requests per minute
const generalLimiter = new RateLimiter(30, 60000); // 30 requests per minute

// Create a schema for story generation requests (without title and content)
const storyGenerationRequestSchema = insertStorySchema.omit({
  title: true,
  content: true,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for deployments
  app.get("/health", (req, res) => {
    res.status(200).json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV 
    });
  });

  // Auth middleware
  await setupAuth(app);

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

        // Use validated and sanitized data
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
          message:
            "PDF downloads are available for Premium and Family subscribers only.",
          upgradeRequired: true,
        });
      }

      const story = await storage.getStory(storyId, userId);
      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }

      // Generate PDF based on tier
      const pdfBuffer =
        tier === "family"
          ? generateEnhancedPDF(story)
          : generateStoryPDF(story);

      const filename = `${story.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );
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
        res
          .status(400)
          .json({ message: "Invalid update data", errors: error.errors });
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
  app.post(
    "/api/favorites/:storyId",
    isAuthenticated,
    async (req: any, res) => {
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

        // Check if already favorited
        const isAlreadyFavorited = await storage.isStoryFavorited(
          userId,
          storyId,
        );
        if (isAlreadyFavorited) {
          return res
            .status(200)
            .json({ message: "Story is already favorited" });
        }

        const favorite = await storage.addFavorite(userId, storyId);
        res.json(favorite);
      } catch (error) {
        console.error("Error adding favorite:", error);
        res.status(500).json({ message: "Failed to add favorite" });
      }
    },
  );

  // Remove story from favorites
  app.delete(
    "/api/favorites/:storyId",
    isAuthenticated,
    async (req: any, res) => {
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
    },
  );

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
  app.get(
    "/api/favorites/:storyId/status",
    isAuthenticated,
    async (req: any, res) => {
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
    },
  );

  // Stripe payment routes

  // Create payment intent for one-time payments
  app.post(
    "/api/create-payment-intent",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { amount } = req.body;
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: "usd",
        });
        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error: any) {
        res
          .status(500)
          .json({ message: "Error creating payment intent: " + error.message });
      }
    },
  );

  // Get or create subscription for premium features
  app.post(
    "/api/get-or-create-subscription",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        let user = await storage.getUser(userId);
        const { tier = "premium", billing = "monthly" } = req.body;

        console.log("=== SUBSCRIPTION REQUEST DEBUG ===");
        console.log("User ID:", userId);
        console.log("Requested tier:", tier);
        console.log("Requested billing:", billing);
        console.log("Request body:", req.body);

        if (!user) {
          console.error("User not found:", userId);
          return res.status(404).json({ error: { message: "User not found", type: "user_error" } });
        }

        if (!user.email) {
          console.error("User email not found:", userId);
          return res.status(400).json({ error: { message: "User email is required for subscription", type: "user_error" } });
        }

        // Validate tier parameter
        if (!["premium", "family"].includes(tier)) {
          console.error("Invalid tier specified:", tier);
          return res.status(400).json({ error: { message: "Invalid subscription tier. Must be 'premium' or 'family'", type: "validation_error" } });
        }

        // Validate billing parameter
        if (!["monthly", "yearly"].includes(billing)) {
          console.error("Invalid billing period:", billing);
          return res.status(400).json({ error: { message: "Invalid billing period. Must be 'monthly' or 'yearly'", type: "validation_error" } });
        }

        // If user already has a subscription, retrieve it
        if (user.stripeSubscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(
            user.stripeSubscriptionId,
            {
              expand: ["latest_invoice.payment_intent"],
            },
          );

          console.log("Existing subscription status:", subscription.status);

          // If subscription is expired or incomplete for too long, cancel it and create a new one
          if (subscription.status === "incomplete_expired" || 
              (subscription.status === "incomplete" && 
               new Date(subscription.created * 1000) < new Date(Date.now() - 24 * 60 * 60 * 1000))) {
            console.log("Subscription expired or incomplete too long, canceling and creating new one");
            try {
              await stripe.subscriptions.cancel(subscription.id);
            } catch (cancelError: any) {
              // If subscription doesn't exist anymore, that's fine - we'll create a new one
              if (cancelError.code === "resource_missing") {
                console.log(
                  "Expired subscription no longer exists in Stripe, proceeding to create new one",
                );
              } else {
                throw cancelError;
              }
            }
            // Clear the expired subscription ID and continue to create new one
            user = await storage.updateUserStripeInfo(
              userId,
              user.stripeCustomerId!,
              null,
            );
          } else {
            // Handle active or recoverable subscriptions
            let clientSecret = null;

            // If subscription is incomplete, get the client secret
            if (
              subscription.status === "incomplete" ||
              subscription.status === "past_due"
            ) {
              if (
                subscription.latest_invoice &&
                typeof subscription.latest_invoice === "object"
              ) {
                const invoice = subscription.latest_invoice;
                if (
                  invoice.payment_intent &&
                  typeof invoice.payment_intent === "object"
                ) {
                  clientSecret = invoice.payment_intent.client_secret;
                }
              }

              // If no client secret found, try to create a new payment intent
              if (!clientSecret) {
                console.log("No client secret found for incomplete subscription, creating new one");
                try {
                  await stripe.subscriptions.cancel(subscription.id);
                  user = await storage.updateUserStripeInfo(
                    userId,
                    user.stripeCustomerId!,
                    null,
                  );
                  // Continue to create new subscription below
                } catch (error) {
                  console.error("Error canceling incomplete subscription:", error);
                  throw error;
                }
              }
            }

            if (clientSecret) {
              console.log(
                "Existing subscription client secret:",
                clientSecret ? "Yes" : "No",
              );

              res.send({
                subscriptionId: subscription.id,
                clientSecret,
                status: subscription.status,
              });
              return;
            }
          }
        }

        // Create new Stripe customer and subscription
        let customer;
        
        try {
          customer = await stripe.customers.create({
            email: user.email,
            name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
            metadata: {
              userId: userId,
              tier: tier
            }
          });
          console.log("Created Stripe customer:", customer.id);
        } catch (error: any) {
          console.error("Error creating Stripe customer:", error);
          throw new Error(`Failed to create customer: ${error.message}`);
        }

        try {
          user = await storage.updateStripeCustomerId(userId, customer.id);
          console.log("Updated user with Stripe customer ID");
        } catch (error: any) {
          console.error("Error updating user with Stripe customer ID:", error);
          throw new Error(`Failed to update user: ${error.message}`);
        }

        // Determine pricing based on tier (default to premium if not specified)
        // Determine pricing based on tier and billing period
        let priceInCents: number;
        if (tier === "family") {
          priceInCents = billing === "yearly" ? 10900 : 1299; // $109/year or $12.99/month
        } else if (tier === "premium") {
          priceInCents = billing === "yearly" ? 5900 : 699; // $59/year or $6.99/month
        } else {
          throw new Error("Invalid tier specified");
        }

        // Create product first
        let product;
        try {
          product = await stripe.products.create({
            name: tier === "family" ? "Storytime Pro" : "Storytime Plus",
            description: tier === "family" 
              ? "The ultimate storytelling experience for families with multiple children"
              : "Unlimited personalized bedtime stories for your little one",
            metadata: {
              tier: tier,
              userId: userId
            }
          });
          console.log("Created Stripe product:", product.id);
        } catch (error: any) {
          console.error("Error creating Stripe product:", error);
          throw new Error(`Failed to create product: ${error.message}`);
        }

        // Create price for the product
        let price;
        try {
          price = await stripe.prices.create({
            currency: "usd",
            product: product.id,
            unit_amount: priceInCents,
            recurring: {
              interval: billing === "yearly" ? "year" : "month",
            },
            metadata: {
              tier: tier,
              billing: billing
            }
          });
          console.log("Created Stripe price:", price.id);
        } catch (error: any) {
          console.error("Error creating Stripe price:", error);
          throw new Error(`Failed to create price: ${error.message}`);
        }

        // Create subscription for premium stories
        let subscription;
        try {
          subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [
              {
                price: price.id,
              },
            ],
            payment_behavior: "default_incomplete",
            payment_settings: { save_default_payment_method: "on_subscription" },
            expand: ["latest_invoice.payment_intent"],
            metadata: {
              userId: userId,
              tier: tier,
              billing: billing
            }
          });
          console.log("Created Stripe subscription:", subscription.id);
        } catch (error: any) {
          console.error("Error creating Stripe subscription:", error);
          throw new Error(`Failed to create subscription: ${error.message}`);
        }

        try {
          await storage.updateUserStripeInfo(
            userId,
            customer.id,
            subscription.id,
          );
          console.log("Updated user with subscription info");
        } catch (error: any) {
          console.error("Error updating user with subscription info:", error);
          throw new Error(`Failed to update user subscription info: ${error.message}`);
        }

        let clientSecret = null;
        if (
          subscription.latest_invoice &&
          typeof subscription.latest_invoice === "object"
        ) {
          const invoice = subscription.latest_invoice;
          if (
            invoice.payment_intent &&
            typeof invoice.payment_intent === "object"
          ) {
            clientSecret = invoice.payment_intent.client_secret;
          }
        }

        console.log("=== SUBSCRIPTION DEBUG INFO ===");
        console.log("User ID:", userId);
        console.log("Tier requested:", tier);
        console.log("Subscription ID:", subscription.id);
        console.log("Subscription status:", subscription.status);
        console.log("Billing period:", billing);
        console.log("Price in cents:", priceInCents);
        console.log("Client secret generated:", clientSecret ? "Yes" : "No");
        console.log("Customer ID:", customer.id);
        console.log("Customer email:", customer.email);
        console.log("Product ID:", product.id);
        console.log("Price ID:", price.id);
        console.log("User email:", user.email);
        console.log(
          "Latest invoice:",
          subscription.latest_invoice ? "exists" : "missing",
        );
        if (subscription.latest_invoice && typeof subscription.latest_invoice === "object") {
          console.log("Payment intent exists:", subscription.latest_invoice.payment_intent ? "Yes" : "No");
          if (subscription.latest_invoice.payment_intent && typeof subscription.latest_invoice.payment_intent === "object") {
            console.log("Payment intent status:", subscription.latest_invoice.payment_intent.status);
            console.log("Payment intent client secret exists:", subscription.latest_invoice.payment_intent.client_secret ? "Yes" : "No");
          }
        }
        console.log("Response being sent:", {
          subscriptionId: subscription.id,
          clientSecret: clientSecret ? "Present" : "Missing",
          hasError: false
        });
        console.log("=== END DEBUG INFO ===");

        if (!clientSecret) {
          console.error(
            "Failed to generate client secret. Subscription details:",
            {
              id: subscription.id,
              status: subscription.status,
              latest_invoice: subscription.latest_invoice ? "exists" : "missing",
              latest_invoice_details: subscription.latest_invoice && typeof subscription.latest_invoice === "object" 
                ? {
                    payment_intent: subscription.latest_invoice.payment_intent ? "exists" : "missing",
                    payment_intent_type: typeof subscription.latest_invoice.payment_intent
                  }
                : "N/A"
            },
          );
          throw new Error("Failed to create payment intent for subscription. No client secret available.");
        }

        res.send({
          subscriptionId: subscription.id,
          clientSecret,
        });
      } catch (error: any) {
        console.error("Subscription error:", error);
        console.error("Error stack:", error.stack);
        
        // Provide more specific error messages
        let errorMessage = "An unexpected error occurred while setting up your subscription.";
        let statusCode = 500;
        
        if (error.type === "StripeCardError") {
          errorMessage = "There was an issue with your payment method. Please try a different card.";
          statusCode = 400;
        } else if (error.type === "StripeRateLimitError") {
          errorMessage = "Too many requests. Please wait a moment and try again.";
          statusCode = 429;
        } else if (error.type === "StripeInvalidRequestError") {
          errorMessage = "Invalid subscription request. Please contact support.";
          statusCode = 400;
        } else if (error.type === "StripeAPIError") {
          errorMessage = "Payment service temporarily unavailable. Please try again.";
          statusCode = 503;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        return res.status(statusCode).json({ 
          error: { 
            message: errorMessage,
            type: error.type || "subscription_error"
          } 
        });
      }
    },
  );

  // Get user's subscription status
  app.get(
    "/api/subscription-status",
    isAuthenticated,
    async (req: any, res) => {
      try {
        console.log("=== SUBSCRIPTION STATUS DEBUG ===");
        const userId = req.user?.claims?.sub;
        console.log("User ID from claims:", userId);

        if (!userId) {
          console.log("No user ID found in claims");
          return res.status(400).json({
            error: "No user ID found",
            hasActiveSubscription: false,
          });
        }

        const user = await storage.getUser(userId);
        console.log("User from storage:", user ? "Found" : "Not found");
        console.log("User stripe subscription ID:", user?.stripeSubscriptionId);

        if (!user || !user.stripeSubscriptionId) {
          console.log("No user or no subscription ID");
          return res.json({ hasActiveSubscription: false });
        }

        console.log(
          "Retrieving Stripe subscription:",
          user.stripeSubscriptionId,
        );
        const subscription = await stripe.subscriptions.retrieve(
          user.stripeSubscriptionId,
        );
        console.log("Stripe subscription status:", subscription.status);

        // Synchronize user tier with Stripe subscription status
        let shouldUpdateUserTier = false;
        let newTier: string = user.subscriptionTier || "free";
        let newStatus: string = subscription.status;

        // Determine the correct tier based on subscription
        if (subscription.status === "active" || subscription.status === "trialing") {
          // Get the tier from subscription metadata or items
          const subscriptionTier = subscription.metadata?.tier || 
            (subscription.items.data[0]?.price.metadata?.tier) || "premium";
          if (user.subscriptionTier !== subscriptionTier) {
            newTier = subscriptionTier;
            shouldUpdateUserTier = true;
          }
        } else if (subscription.status === "incomplete" || 
                  subscription.status === "past_due" || 
                  subscription.status === "canceled" ||
                  subscription.status === "incomplete_expired") {
          // For incomplete or failed subscriptions, keep them on free tier
          if (user.subscriptionTier !== "free") {
            newTier = "free";
            shouldUpdateUserTier = true;
          }
        }

        // Update user tier if needed
        if (shouldUpdateUserTier || user.subscriptionStatus !== subscription.status) {
          await storage.updateUserSubscription(userId, newTier as any, subscription.status as any);
          console.log(`Updated user tier from ${user.subscriptionTier} to ${newTier}, status: ${subscription.status}`);
        }

        res.json({
          hasActiveSubscription: subscription.status === "active" || subscription.status === "trialing",
          status: subscription.status,
          subscriptionId: subscription.id,
          tier: newTier,
        });
        console.log("=== END SUBSCRIPTION STATUS DEBUG ===");
      } catch (error: any) {
        console.error("Error checking subscription status:", error);
        console.error("Error stack:", error.stack);
        res.status(500).json({
          message: "Failed to check subscription status",
          error: error.message,
          stack:
            process.env.NODE_ENV === "development" ? error.stack : undefined,
        });
      }
    },
  );

  // Stripe webhook handler
  app.post("/api/stripe/webhook", async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    let event: Stripe.Event;

    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.error("Missing STRIPE_WEBHOOK_SECRET");
        return res.status(400).send("Webhook secret not configured");
      }

      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case "invoice.payment_succeeded": {
          const invoice = event.data.object as Stripe.Invoice;

          if (invoice.subscription) {
            const subscription = await stripe.subscriptions.retrieve(
              invoice.subscription as string,
            );
            const customer = (await stripe.customers.retrieve(
              subscription.customer as string,
            )) as Stripe.Customer;

            // Find user by Stripe customer ID
            const userResults = await db
              .select()
              .from(users)
              .where(eq(users.stripeCustomerId, customer.id));

            if (userResults.length > 0) {
              const user = userResults[0];

              // Determine tier based on subscription amount
              const priceAmount = invoice.amount_paid;
              let tier: "premium" | "family" = "premium";

              if (priceAmount >= 1299) {
                // $12.99 or higher = family plan
                tier = "family";
              }

              // Update user subscription tier and status
              await updateUserSubscription(user.id, tier, subscription.status);

              console.log(
                `Updated user ${user.id} to ${tier} tier with status ${subscription.status}`,
              );
            }
          }
          break;
        }

        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          const customer = (await stripe.customers.retrieve(
            subscription.customer as string,
          )) as Stripe.Customer;

          // Find user by Stripe customer ID
          const userResults = await db
            .select()
            .from(users)
            .where(eq(users.stripeCustomerId, customer.id));

          if (userResults.length > 0) {
            const user = userResults[0];

            // Determine tier based on subscription items
            let tier: "free" | "premium" | "family" = "free";

            if (
              subscription.status === "active" ||
              subscription.status === "trialing"
            ) {
              // Check the price to determine tier
              if (subscription.items.data.length > 0) {
                const price = subscription.items.data[0].price;
                if (price.unit_amount && price.unit_amount >= 1299) {
                  tier = "family";
                } else if (price.unit_amount && price.unit_amount >= 699) {
                  tier = "premium";
                }
              }
            }

            await updateUserSubscription(user.id, tier, subscription.status);
            console.log(
              `Updated user ${user.id} subscription: ${tier} tier, status ${subscription.status}`,
            );
          }
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          const customer = (await stripe.customers.retrieve(
            subscription.customer as string,
          )) as Stripe.Customer;

          // Find user by Stripe customer ID
          const userResults = await db
            .select()
            .from(users)
            .where(eq(users.stripeCustomerId, customer.id));

          if (userResults.length > 0) {
            const user = userResults[0];
            await updateUserSubscription(user.id, "free", "canceled");
            console.log(
              `Downgraded user ${user.id} to free tier (subscription canceled)`,
            );
          }
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error("Error processing webhook:", error);
      return res.status(500).send("Webhook processing failed");
    }

    res.json({ received: true });
  });

  // Debug endpoints for testing (remove in production)
  const { registerDebugRoutes, setupDebugRoutes } = await import(
    "./debugRoutes"
  );
  registerDebugRoutes(app);
  setupDebugRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}