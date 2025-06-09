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

        if (!user) {
          console.error("User not found:", userId);
          return res.status(404).json({ 
            error: { message: "User not found", type: "user_error" } 
          });
        }

        if (!user.email) {
          console.error("User email not found:", userId);
          return res.status(400).json({ 
            error: { message: "User email is required for subscription", type: "user_error" } 
          });
        }

        // Validate parameters
        if (!["premium", "family"].includes(tier)) {
          return res.status(400).json({ 
            error: { message: "Invalid subscription tier", type: "validation_error" } 
          });
        }

        if (!["monthly", "yearly"].includes(billing)) {
          return res.status(400).json({ 
            error: { message: "Invalid billing period", type: "validation_error" } 
          });
        }

        // Define predefined price IDs - these need to be created in your Stripe dashboard
        // For now, we'll create prices dynamically but with a simpler approach
        const pricingConfig = {
          premium: {
            monthly: { amount: 699, interval: "month" as const },
            yearly: { amount: 5900, interval: "year" as const }
          },
          family: {
            monthly: { amount: 1299, interval: "month" as const },
            yearly: { amount: 10900, interval: "year" as const }
          }
        };

        const pricingInfo = pricingConfig[tier as keyof typeof pricingConfig][billing as keyof typeof pricingConfig.premium];

        // Check for existing subscription
        if (user.stripeSubscriptionId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(
              user.stripeSubscriptionId,
              { expand: ["latest_invoice.payment_intent"] }
            );

            if (subscription.status === "active" || subscription.status === "trialing") {
              return res.json({
                subscriptionId: subscription.id,
                status: subscription.status,
                message: "Subscription already active"
              });
            }

            if (subscription.status === "incomplete") {
              const invoice = subscription.latest_invoice as Stripe.Invoice;
              const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent;
              
              if (paymentIntent?.client_secret) {
                return res.json({
                  subscriptionId: subscription.id,
                  clientSecret: paymentIntent.client_secret,
                  status: subscription.status
                });
              }
            }

            // Cancel expired or problematic subscriptions
            if (["incomplete_expired", "canceled", "past_due"].includes(subscription.status)) {
              await stripe.subscriptions.cancel(subscription.id);
              await storage.updateUserStripeInfo(userId, user.stripeCustomerId!, null);
            }
          } catch (error: any) {
            console.log("Error retrieving existing subscription:", error.message);
            // Clear invalid subscription ID
            await storage.updateUserStripeInfo(userId, user.stripeCustomerId!, null);
          }
        }

        // Create or get customer
        let customer;
        if (user.stripeCustomerId) {
          try {
            customer = await stripe.customers.retrieve(user.stripeCustomerId);
          } catch (error) {
            customer = null;
          }
        }

        if (!customer) {
          customer = await stripe.customers.create({
            email: user.email,
            name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
            metadata: { userId, tier }
          });
          
          await storage.updateStripeCustomerId(userId, customer.id);
          console.log("Created new customer:", customer.id);
        }

        // First, create or get a product
        const productName = tier === "family" ? "Storytime Pro" : "Storytime Plus";
        let product;
        
        try {
          // Try to find existing product by name
          const products = await stripe.products.list({ limit: 100 });
          product = products.data.find(p => p.name === productName);
          
          if (!product) {
            // Create new product
            product = await stripe.products.create({
              name: productName,
              description: tier === "family" 
                ? "The ultimate storytelling experience for families with multiple children"
                : "Unlimited personalized bedtime stories for your little one"
            });
            console.log("Created new product:", product.id);
          }
        } catch (error: any) {
          console.error("Error creating/finding product:", error);
          throw new Error("Failed to set up subscription product");
        }

        // Create price for the product
        let price;
        try {
          price = await stripe.prices.create({
            currency: "usd",
            unit_amount: pricingInfo.amount,
            recurring: { interval: pricingInfo.interval },
            product: product.id,
            metadata: { tier, billing }
          });
          console.log("Created new price:", price.id);
        } catch (error: any) {
          console.error("Error creating price:", error);
          throw new Error("Failed to create subscription pricing");
        }

        // Create subscription
        const subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{ price: price.id }],
          payment_behavior: "default_incomplete",
          payment_settings: { save_default_payment_method: "on_subscription" },
          expand: ["latest_invoice.payment_intent"],
          metadata: { userId, tier, billing }
        });

        console.log("Created subscription:", subscription.id);

        // Update user with subscription info
        await storage.updateUserStripeInfo(userId, customer.id, subscription.id);

        // Get client secret
        const invoice = subscription.latest_invoice as Stripe.Invoice;
        const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent;
        const clientSecret = paymentIntent?.client_secret;

        if (!clientSecret) {
          throw new Error("Failed to create payment intent");
        }

        console.log("Subscription setup complete");

        res.json({
          subscriptionId: subscription.id,
          clientSecret,
          status: subscription.status
        });

      } catch (error: any) {
        console.error("Subscription creation error:", error);
        
        let errorMessage = "Failed to create subscription";
        let statusCode = 500;
        
        if (error.type?.includes("Stripe")) {
          if (error.type === "StripeInvalidRequestError") {
            errorMessage = "Invalid subscription request. Please try again.";
            statusCode = 400;
          } else if (error.type === "StripeCardError") {
            errorMessage = "Payment method issue. Please try a different card.";
            statusCode = 400;
          } else if (error.type === "StripeRateLimitError") {
            errorMessage = "Too many requests. Please wait and try again.";
            statusCode = 429;
          } else {
            errorMessage = "Payment service temporarily unavailable.";
            statusCode = 503;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        res.status(statusCode).json({ 
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