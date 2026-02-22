
import type { Express } from "express";
import Stripe from "stripe";
import { isAuthenticated } from "../authMiddleware";
import { storage } from "../storage";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { validateInput, paymentIntentSchema, subscriptionSchema } from "../inputValidation";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing required Stripe secret: STRIPE_SECRET_KEY");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-05-28.basil",
});

export function registerPaymentRoutes(app: Express): void {
  // Create payment intent for one-time payments
  app.post("/api/create-payment-intent", isAuthenticated, validateInput(paymentIntentSchema), async (req: any, res) => {
    try {
      const { amount } = req.validatedBody;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ 
        message: "Error creating payment intent: " + error.message 
      });
    }
  });

  // Get or create subscription for premium features
  app.post("/api/get-or-create-subscription", isAuthenticated, validateInput(subscriptionSchema), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let user = await storage.getUser(userId);
      const { tier, billing } = req.validatedBody;

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

      // Define pricing configuration
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
            const invoice = subscription.latest_invoice as any;
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

      // Create or get product
      const productName = tier === "family" ? "Storytime Pro" : "Storytime Plus";
      let product;
      
      try {
        const products = await stripe.products.list({ limit: 100 });
        product = products.data.find(p => p.name === productName);
        
        if (!product) {
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
      const invoice = subscription.latest_invoice as any;
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
  });

  // Get user's subscription status
  app.get("/api/subscription-status", isAuthenticated, async (req: any, res) => {
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

      console.log("Retrieving Stripe subscription:", user.stripeSubscriptionId);
      let subscription;
      try {
        subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        console.log("Stripe subscription status:", subscription.status);
      } catch (stripeError: any) {
        // Handle case where subscription doesn't exist in Stripe (404)
        if (stripeError.statusCode === 404 || stripeError.code === 'resource_missing') {
          console.log("Subscription not found in Stripe, clearing user subscription data");
          // Clear the stale subscription data from the user, including the subscription ID
          await db.update(users).set({
            subscriptionTier: "free",
            subscriptionStatus: "canceled",
            stripeSubscriptionId: null,
            updatedAt: new Date()
          }).where(eq(users.id, userId));
          console.log("Cleared stripeSubscriptionId for user:", userId);
          return res.json({ 
            hasActiveSubscription: false,
            status: "canceled",
            tier: "free",
            message: "Subscription no longer exists"
          });
        }
        throw stripeError; // Re-throw other errors
      }

      // Synchronize user tier with Stripe subscription status
      let shouldUpdateUserTier = false;
      let newTier: string = user.subscriptionTier || "free";
      let newStatus: string = subscription.status;

      // Determine the correct tier based on subscription
      if (subscription.status === "active" || subscription.status === "trialing") {
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
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  });
}
