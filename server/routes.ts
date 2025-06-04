import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertStorySchema } from "@shared/schema";
import { generateBedtimeStory } from "./openai";
import { checkStoryGenerationPermissions, validateStoryParameters, addTierInfoToResponse } from "./tierMiddleware";
import { incrementWeeklyUsage, getCurrentWeekStart, updateUserSubscription, getUserTier, canUserGenerateStory, getUserWeeklyUsage } from "./tierManager";
import { generateStoryPDF, generateEnhancedPDF } from "./pdfGenerator";
import { db } from "./db";
import { users, usageTracking } from "../shared/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

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

  // Get user tier and usage information
  app.get('/api/user/tier-info', isAuthenticated, addTierInfoToResponse, async (req: any, res) => {
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
        limits: req.tierLimits
      });
    } catch (error) {
      console.error("Error fetching tier info:", error);
      res.status(500).json({ message: "Failed to fetch tier information" });
    }
  });

  // Story generation endpoint
  app.post("/api/stories/generate", 
    isAuthenticated, 
    checkStoryGenerationPermissions,
    validateStoryParameters,
    async (req: any, res) => {
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

      // Track usage for free users
      if (req.userTier === 'free') {
        await incrementWeeklyUsage(userId);
      }

      res.json({
        ...story,
        userTier: req.userTier,
        tierLimits: req.tierLimits
      });
    } catch (error) {
      console.error("Error generating story:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid story parameters", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to generate story" });
      }
    }
  });

  // Get user's stories with tier-based restrictions
  app.get("/api/stories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tier } = await getUserTier(userId);
      let stories = await storage.getUserStories(userId);

      // Apply story library restrictions for free users
      if (tier === 'free') {
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
      if (tier === 'free') {
        return res.status(403).json({
          error: 'PDF download restricted',
          message: 'PDF downloads are available for Premium and Family subscribers only.',
          upgradeRequired: true
        });
      }

      const story = await storage.getStory(storyId, userId);
      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }

      // Generate PDF based on tier
      const pdfBuffer = tier === 'family' 
        ? generateEnhancedPDF(story)
        : generateStoryPDF(story);

      const filename = `${story.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
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

      // Check if already favorited
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

  // Stripe payment routes

  // Create payment intent for one-time payments
  app.post("/api/create-payment-intent", isAuthenticated, async (req: any, res) => {
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
  });

  // Get or create subscription for premium features
  app.post('/api/get-or-create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let user = await storage.getUser(userId);
        const { tier, billing = 'monthly' } = req.body;

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // If user already has a subscription, retrieve it
      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
          expand: ['latest_invoice.payment_intent'],
        });

        console.log('Existing subscription status:', subscription.status);

        // If subscription is expired, cancel it and create a new one
        if (subscription.status === 'incomplete_expired') {
          console.log('Subscription expired, canceling and creating new one');
          try {
            await stripe.subscriptions.cancel(subscription.id);
          } catch (cancelError: any) {
            // If subscription doesn't exist anymore, that's fine - we'll create a new one
            if (cancelError.code === 'resource_missing') {
              console.log('Expired subscription no longer exists in Stripe, proceeding to create new one');
            } else {
              throw cancelError;
            }
          }
          // Clear the expired subscription ID and continue to create new one
          user = await storage.updateUserStripeInfo(userId, user.stripeCustomerId!, null);
        } else {
          // Handle active or recoverable subscriptions
          let clientSecret = null;

          // If subscription is incomplete, get the client secret
          if (subscription.status === 'incomplete' || subscription.status === 'past_due') {
            if (subscription.latest_invoice && typeof subscription.latest_invoice === 'object') {
              const invoice = subscription.latest_invoice;
              if (invoice.payment_intent && typeof invoice.payment_intent === 'object') {
                clientSecret = invoice.payment_intent.client_secret;
              }
            }
          }

          console.log('Existing subscription client secret:', clientSecret ? 'Yes' : 'No');

          res.send({
            subscriptionId: subscription.id,
            clientSecret,
            status: subscription.status,
          });
          return;
        }
      }

      if (!user.email) {
        throw new Error('No user email on file');
      }

      // Create new Stripe customer and subscription
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      });

      user = await storage.updateStripeCustomerId(userId, customer.id);

      // Determine pricing based on tier (default to premium if not specified)
      // Determine pricing based on tier and billing period
      let priceInCents: number;
      if (tier === 'family') {
        priceInCents = billing === 'yearly' ? 10900 : 1299; // $109/year or $12.99/month
      } else if (tier === 'premium') {
        priceInCents = billing === 'yearly' ? 5900 : 699; // $59/year or $6.99/month
      } else {
        throw new Error('Invalid tier specified');
      }

      // Create product first
      const product = await stripe.products.create({
        name: tier === 'family' ? 'Storytime Pro' : 'Storytime Plus',
      });

      // Create price for the product
      const price = await stripe.prices.create({
        currency: 'usd',
        product: product.id,
        unit_amount: priceInCents,
        recurring: {
          interval: billing === 'yearly' ? 'year' : 'month',
        },
      });

      // Create subscription for premium stories
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: price.id,
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      await storage.updateUserStripeInfo(userId, customer.id, subscription.id);

      let clientSecret = null;
      if (subscription.latest_invoice && typeof subscription.latest_invoice === 'object') {
        const invoice = subscription.latest_invoice;
        if (invoice.payment_intent && typeof invoice.payment_intent === 'object') {
          clientSecret = invoice.payment_intent.client_secret;
        }
      }

      console.log('=== SUBSCRIPTION DEBUG INFO ===');
      console.log('Subscription ID:', subscription.id);
      console.log('Subscription status:', subscription.status);
      console.log('Billing period:', billing);
      console.log('Price in cents:', priceInCents);
      console.log('Client secret generated:', clientSecret ? 'Yes' : 'No');
      console.log('Customer ID:', customer.id);
      console.log('Product ID:', product.id);
      console.log('Price ID:', price.id);
      console.log('Latest invoice payment intent:', subscription.latest_invoice ? typeof subscription.latest_invoice.payment_intent : 'No invoice');
      console.log('=== END DEBUG INFO ===');

      if (!clientSecret) {
        console.error('Failed to generate client secret. Subscription details:', {
          id: subscription.id,
          status: subscription.status,
          latest_invoice: subscription.latest_invoice ? 'exists' : 'missing'
        });
        throw new Error('Failed to create payment intent for subscription');
      }

      res.send({
        subscriptionId: subscription.id,
        clientSecret,
      });
    } catch (error: any) {
      console.error("Subscription error:", error);
      return res.status(400).send({ error: { message: error.message } });
    }
  });

  // Get user's subscription status
  app.get('/api/subscription-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || !user.stripeSubscriptionId) {
        return res.json({ hasActiveSubscription: false });
      }

      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

      res.json({ 
        hasActiveSubscription: subscription.status === 'active',
        status: subscription.status,
        subscriptionId: subscription.id
      });
    } catch (error: any) {
      console.error("Error checking subscription status:", error);
      res.status(500).json({ message: "Failed to check subscription status" });
    }
  });

  // Stripe webhook handler
  app.post('/api/stripe/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.error('Missing STRIPE_WEBHOOK_SECRET');
        return res.status(400).send('Webhook secret not configured');
      }

      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;

          if (invoice.subscription) {
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
            const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;

            // Find user by Stripe customer ID
            const userResults = await db.select().from(users).where(eq(users.stripeCustomerId, customer.id));

            if (userResults.length > 0) {
              const user = userResults[0];

              // Determine tier based on subscription amount
              const priceAmount = invoice.amount_paid;
              let tier: 'premium' | 'family' = 'premium';

              if (priceAmount >= 1299) { // $12.99 or higher = family plan
                tier = 'family';
              }

              // Update user subscription tier and status
              await updateUserSubscription(user.id, tier, subscription.status);

              console.log(`Updated user ${user.id} to ${tier} tier with status ${subscription.status}`);
            }
          }
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;

          // Find user by Stripe customer ID
          const userResults = await db.select().from(users).where(eq(users.stripeCustomerId, customer.id));

          if (userResults.length > 0) {
            const user = userResults[0];

            // Determine tier based on subscription items
            let tier: 'free' | 'premium' | 'family' = 'free';

            if (subscription.status === 'active' || subscription.status === 'trialing') {
              // Check the price to determine tier
              if (subscription.items.data.length > 0) {
                const price = subscription.items.data[0].price;
                if (price.unit_amount && price.unit_amount >= 1299) {
                  tier = 'family';
                } else if (price.unit_amount && price.unit_amount >= 699) {
                  tier = 'premium';
                }
              }
            }

            await updateUserSubscription(user.id, tier, subscription.status);
            console.log(`Updated user ${user.id} subscription: ${tier} tier, status ${subscription.status}`);
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;

          // Find user by Stripe customer ID
          const userResults = await db.select().from(users).where(eq(users.stripeCustomerId, customer.id));

          if (userResults.length > 0) {
            const user = userResults[0];
            await updateUserSubscription(user.id, 'free', 'canceled');
            console.log(`Downgraded user ${user.id} to free tier (subscription canceled)`);
          }
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      return res.status(500).send('Webhook processing failed');
    }

    res.json({ received: true });
  });

  // Debug endpoints for testing (remove in production)
  const { registerDebugRoutes } = await import('./debugRoutes');
  registerDebugRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}