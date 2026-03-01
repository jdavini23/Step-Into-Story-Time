import type { Express } from "express";
import Stripe from "stripe";
import { db } from "../db";
import { users, processedStripeEvents } from "@shared/schema";
import { eq } from "drizzle-orm";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing required Stripe secret: STRIPE_SECRET_KEY");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-05-28.basil",
});

export function registerWebhookRoutes(app: Express): void {
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

    // Check if event already processed (idempotency)
    try {
      const existing = await db
        .select()
        .from(processedStripeEvents)
        .where(eq(processedStripeEvents.eventId, event.id))
        .limit(1);

      if (existing.length > 0) {
        console.log(`Event ${event.id} already processed at ${existing[0].processedAt}, skipping`);
        return res.json({ received: true });
      }
    } catch (error) {
      console.error("Error checking processed events:", error);
      // Continue processing - don't fail on idempotency check
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.userId;
          const tier = session.metadata?.tier;

          if (!userId || !tier) {
            console.warn(`Missing metadata in checkout.session.completed: userId=${userId}, tier=${tier}`);
            break;
          }

          const subscriptionId = session.subscription as string;

          await db
            .update(users)
            .set({
              subscriptionTier: tier,
              subscriptionStatus: "active",
              stripeSubscriptionId: subscriptionId,
              updatedAt: new Date(),
            })
            .where(eq(users.id, userId));

          console.log(`✓ Checkout complete: User ${userId} → ${tier} tier (subscription ${subscriptionId})`);
          break;
        }

        case "invoice.payment_succeeded": {
          const invoice = event.data.object as any;
          const subscriptionId = invoice.subscription;

          if (!subscriptionId || typeof subscriptionId !== 'string') break;

          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const customer = await stripe.customers.retrieve(
            subscription.customer as string
          ) as Stripe.Customer;

          // Find user by customer ID
          const userResults = await db
            .select()
            .from(users)
            .where(eq(users.stripeCustomerId, customer.id))
            .limit(1);

          if (userResults.length === 0) {
            console.warn(`No user found for customer ${customer.id}`);
            break;
          }

          const user = userResults[0];

          // Get tier from subscription price metadata
          const priceMetadata = subscription.items.data[0]?.price?.metadata;
          const tier = priceMetadata?.tier || "premium";

          await db
            .update(users)
            .set({
              subscriptionTier: tier,
              subscriptionStatus: subscription.status,
              updatedAt: new Date(),
            })
            .where(eq(users.id, user.id));

          console.log(`✓ Payment succeeded: User ${user.id} → ${tier} tier (status: ${subscription.status})`);
          break;
        }

        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          const customer = await stripe.customers.retrieve(
            subscription.customer as string
          ) as Stripe.Customer;

          const userResults = await db
            .select()
            .from(users)
            .where(eq(users.stripeCustomerId, customer.id))
            .limit(1);

          if (userResults.length === 0) {
            console.warn(`No user found for customer ${customer.id}`);
            break;
          }

          const user = userResults[0];

          // Determine tier from subscription
          let tier: string = "free";
          if (subscription.status === "active" || subscription.status === "trialing") {
            const priceMetadata = subscription.items.data[0]?.price?.metadata;
            tier = priceMetadata?.tier || "premium";
          }

          await db
            .update(users)
            .set({
              subscriptionTier: tier,
              subscriptionStatus: subscription.status,
              updatedAt: new Date(),
            })
            .where(eq(users.id, user.id));

          console.log(`✓ Subscription updated: User ${user.id} → ${tier} tier (status: ${subscription.status})`);
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          const customer = await stripe.customers.retrieve(
            subscription.customer as string
          ) as Stripe.Customer;

          const userResults = await db
            .select()
            .from(users)
            .where(eq(users.stripeCustomerId, customer.id))
            .limit(1);

          if (userResults.length === 0) {
            console.warn(`No user found for customer ${customer.id}`);
            break;
          }

          const user = userResults[0];

          await db
            .update(users)
            .set({
              subscriptionTier: "free",
              subscriptionStatus: "canceled",
              stripeSubscriptionId: null,
              updatedAt: new Date(),
            })
            .where(eq(users.id, user.id));

          console.log(`✓ Subscription deleted: User ${user.id} → free tier`);
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      // Mark event as processed
      await db.insert(processedStripeEvents).values({
        eventId: event.id,
        eventType: event.type,
      });

    } catch (error) {
      console.error("Error processing webhook:", error);
      return res.status(500).send("Webhook processing failed");
    }

    res.json({ received: true });
  });
}
