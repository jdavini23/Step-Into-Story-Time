import type { Express } from "express";
import Stripe from "stripe";
import { isAuthenticated } from "../authMiddleware";
import { storage } from "../storage";
import { validateInput, validateCSRFToken, RateLimiter, checkoutSessionSchema } from "../inputValidation";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing required Stripe secret: STRIPE_SECRET_KEY");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-05-28.basil",
});

// Verify Price IDs are configured
const requiredPriceEnvVars = [
  "STRIPE_PRICE_PREMIUM_MONTHLY",
  "STRIPE_PRICE_PREMIUM_YEARLY",
  "STRIPE_PRICE_FAMILY_MONTHLY",
  "STRIPE_PRICE_FAMILY_YEARLY",
];

for (const envVar of requiredPriceEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required Stripe Price ID: ${envVar}`);
  }
}

export function registerPaymentRoutes(app: Express, generalLimiter: RateLimiter): void {
  // Create Stripe Checkout Session for subscription
  app.post(
    "/api/create-checkout-session",
    isAuthenticated,
    validateCSRFToken,
    validateInput(checkoutSessionSchema),
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { tier, billing } = req.validatedBody;

        // Rate limiting
        if (!generalLimiter.isAllowed(`checkout_${userId}`)) {
          return res.status(429).json({
            error: "Too many checkout requests. Please wait a moment."
          });
        }

        // Get user
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        if (!user.email) {
          return res.status(400).json({ error: "User email required for subscription" });
        }

        // Get or create Stripe customer
        let customerId = user.stripeCustomerId;

        if (!customerId) {
          const customer = await stripe.customers.create({
            email: user.email,
            name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
            metadata: { userId },
          });
          customerId = customer.id;
          await storage.updateStripeCustomerId(userId, customerId);
          console.log(`Created Stripe customer ${customerId} for user ${userId}`);
        }

        // Map tier + billing to Price ID from environment
        const priceIdMap: Record<string, string> = {
          premium_monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY!,
          premium_yearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY!,
          family_monthly: process.env.STRIPE_PRICE_FAMILY_MONTHLY!,
          family_yearly: process.env.STRIPE_PRICE_FAMILY_YEARLY!,
        };

        const priceKey = `${tier}_${billing}`;
        const priceId = priceIdMap[priceKey];

        if (!priceId) {
          return res.status(400).json({ error: "Invalid tier or billing period" });
        }

        console.log(`Creating checkout session for ${tier} ${billing} (price: ${priceId})`);

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          line_items: [{ price: priceId, quantity: 1 }],
          mode: "subscription",
          success_url: `${process.env.BETTER_AUTH_BASE_URL}/?payment=success`,
          cancel_url: `${process.env.BETTER_AUTH_BASE_URL}/pricing`,
          metadata: { userId, tier, billing },
        });

        console.log(`Checkout session created: ${session.id}`);

        res.json({ url: session.url });
      } catch (error: any) {
        console.error("Checkout session creation error:", error);
        res.status(500).json({
          error: error.message || "Failed to create checkout session"
        });
      }
    }
  );

  // Create Stripe Customer Portal Session
  app.post(
    "/api/create-portal-session",
    isAuthenticated,
    validateCSRFToken,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);

        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        if (!user.stripeCustomerId) {
          return res.status(400).json({ error: "No subscription found" });
        }

        // Create Customer Portal Session
        const session = await stripe.billingPortal.sessions.create({
          customer: user.stripeCustomerId,
          return_url: `${process.env.BETTER_AUTH_BASE_URL}/`,
        });

        console.log(`Portal session created for customer ${user.stripeCustomerId}`);

        res.json({ url: session.url });
      } catch (error: any) {
        console.error("Portal session creation error:", error);
        res.status(500).json({
          error: error.message || "Failed to create portal session"
        });
      }
    }
  );
}
