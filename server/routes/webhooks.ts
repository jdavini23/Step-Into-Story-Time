
import type { Express } from "express";
import Stripe from "stripe";
import { db } from "../db";
import { users } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { updateUserSubscription } from "../tierManager";

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

    try {
      switch (event.type) {
        case "invoice.payment_succeeded": {
          const invoice = event.data.object as any;

          if (invoice.subscription && typeof invoice.subscription === 'string') {
            const subscription = await stripe.subscriptions.retrieve(
              invoice.subscription,
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

              // Get tier from subscription metadata (set during creation)
              const subscriptionData = await stripe.subscriptions.retrieve(
                invoice.subscription as string
              );
              const tierFromMetadata = subscriptionData.items.data[0]?.price?.metadata?.tier;
              let tier: "premium" | "family" = "premium";

              if (tierFromMetadata === "family") {
                tier = "family";
              } else if (tierFromMetadata === "premium") {
                tier = "premium";
              } else {
                // Fallback to amount-based detection if metadata missing
                const priceAmount = invoice.amount_paid;
                if (priceAmount >= 1299) {
                  tier = "family";
                }
                console.warn(`No tier metadata found for subscription ${invoice.subscription}, using amount-based fallback`);
              }

              // Update user subscription tier and status
              await updateUserSubscription(user.id, tier, subscriptionData.status as any);

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

            await updateUserSubscription(user.id, tier, subscription.status as any);
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
}
