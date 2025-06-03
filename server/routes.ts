import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertStorySchema } from "@shared/schema";
import { generateBedtimeStory } from "./openai";
import { checkStoryGenerationPermissions, validateStoryParameters, addTierInfoToResponse } from "./tierMiddleware";
import { incrementWeeklyUsage, getCurrentWeekStart, updateUserSubscription, getUserTier, canUserGenerateStory, getUserWeeklyUsage } from "./tierManager";
import { db } from "./db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
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

  // Create or get subscription for premium features
  app.post('/api/get-or-create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // If user already has a subscription, retrieve it
      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
          expand: ['latest_invoice.payment_intent'],
        });
        
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

        console.log('Existing subscription status:', subscription.status);
        console.log('Existing subscription client secret:', clientSecret ? 'Yes' : 'No');

        res.send({
          subscriptionId: subscription.id,
          clientSecret,
          status: subscription.status,
        });
        return;
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
      const tier = req.body.tier || 'premium';
      const unitAmount = tier === 'family' ? 1299 : 699; // $12.99 for family, $6.99 for premium
      const productName = tier === 'family' ? 'Storytime Pro (Family Plan)' : 'Storytime Plus (Premium Plan)';

      // Create a price for the subscription
      const price = await stripe.prices.create({
        currency: 'usd',
        unit_amount: unitAmount,
        recurring: { interval: 'month' },
        product_data: {
          name: productName,
        },
      });

      // Create subscription for premium stories
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: price.id }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription',
        },
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

      console.log('Subscription created:', subscription.id);
      console.log('Client secret generated:', clientSecret ? 'Yes' : 'No');
      console.log('Latest invoice payment intent:', typeof invoice?.payment_intent);

      if (!clientSecret) {
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
          const users = await db.select().from(storage.users).where(eq(storage.users.stripeCustomerId, customer.id));
          
          if (users.length > 0) {
            const user = users[0];
            
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
          const users = await db.select().from(storage.users).where(eq(storage.users.stripeCustomerId, customer.id));
          
          if (users.length > 0) {
            const user = users[0];
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

  const httpServer = createServer(app);
  return httpServer;
}
