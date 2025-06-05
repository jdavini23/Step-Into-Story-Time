import type { Express } from "express";
import Stripe from "stripe";
import { isAuthenticated } from "../replitAuth";
import { storage } from "../storage";
import { updateUserSubscription } from "../tierManager";
import { db } from "../db";
import { users } from "../../shared/schema";
import { eq } from "drizzle-orm";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing required Stripe secret: STRIPE_SECRET_KEY");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export function paymentsRoutes(app: Express) {
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
        const { tier, billing = "monthly" } = req.body;

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Handle existing subscription
        if (user.stripeSubscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(
            user.stripeSubscriptionId,
            { expand: ["latest_invoice.payment_intent"] },
          );

          console.log("Existing subscription status:", subscription.status);

          if (subscription.status === "incomplete_expired") {
            console.log("Subscription expired, canceling and creating new one");
            try {
              await stripe.subscriptions.cancel(subscription.id);
            } catch (cancelError: any) {
              if (cancelError.code === "resource_missing") {
                console.log(
                  "Expired subscription no longer exists in Stripe, proceeding to create new one",
                );
              } else {
                throw cancelError;
              }
            }
            user = await storage.updateUserStripeInfo(
              userId,
              user.stripeCustomerId!,
              null,
            );
          } else {
            let clientSecret = null;

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
            }

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

        if (!user.email) {
          throw new Error("No user email on file");
        }

        // Create new Stripe customer and subscription
        const customer = await stripe.customers.create({
          email: user.email,
          name:
            `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            user.email,
        });

        user = await storage.updateStripeCustomerId(userId, customer.id);

        // Determine pricing based on tier and billing period
        let priceInCents: number;
        if (tier === "family") {
          priceInCents = billing === "yearly" ? 10900 : 1299; // $109/year or $12.99/month
        } else if (tier === "premium") {
          priceInCents = billing === "yearly" ? 5900 : 699; // $59/year or $6.99/month
        } else {
          throw new Error("Invalid tier specified");
        }

        const product = await stripe.products.create({
          name: tier === "family" ? "Storytime Pro" : "Storytime Plus",
        });

        const price = await stripe.prices.create({
          currency: "usd",
          product: product.id,
          unit_amount: priceInCents,
          recurring: { interval: billing === "yearly" ? "year" : "month" },
        });

        const subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{ price: price.id }],
          payment_behavior: "default_incomplete",
          payment_settings: { save_default_payment_method: "on_subscription" },
          expand: ["latest_invoice.payment_intent"],
        });

        await storage.updateUserStripeInfo(
          userId,
          customer.id,
          subscription.id,
        );

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
        console.log("Subscription ID:", subscription.id);
        console.log("Subscription status:", subscription.status);
        console.log("Billing period:", billing);
        console.log("Price in cents:", priceInCents);
        console.log("Client secret generated:", clientSecret ? "Yes" : "No");
        console.log("=== END DEBUG INFO ===");

        if (!clientSecret) {
          console.error(
            "Failed to generate client secret. Subscription details:",
            {
              id: subscription.id,
              status: subscription.status,
              latest_invoice: subscription.latest_invoice
                ? "exists"
                : "missing",
            },
          );
          throw new Error("Failed to create payment intent for subscription");
        }

        res.send({
          subscriptionId: subscription.id,
          clientSecret,
        });
      } catch (error: any) {
        console.error("Subscription error:", error);
        return res.status(400).send({ error: { message: error.message } });
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

        res.json({
          hasActiveSubscription: subscription.status === "active",
          status: subscription.status,
          subscriptionId: subscription.id,
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

            const userResults = await db
              .select()
              .from(users)
              .where(eq(users.stripeCustomerId, customer.id));

            if (userResults.length > 0) {
              const user = userResults[0];
              const priceAmount = invoice.amount_paid;
              let tier: "premium" | "family" = "premium";

              if (priceAmount >= 1299) {
                tier = "family";
              }

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

          const userResults = await db
            .select()
            .from(users)
            .where(eq(users.stripeCustomerId, customer.id));

          if (userResults.length > 0) {
            const user = userResults[0];
            let tier: "free" | "premium" | "family" = "free";

            if (
              subscription.status === "active" ||
              subscription.status === "trialing"
            ) {
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
