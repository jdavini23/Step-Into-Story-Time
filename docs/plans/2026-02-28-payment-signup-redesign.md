# Payment & Signup Flow Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace broken Stripe Elements payment flow with Stripe Checkout, eliminate race conditions, and establish webhooks as single source of truth for subscription tiers.

**Architecture:** Stripe Checkout handles payment UI, webhooks update DB tier, Customer Portal handles subscription management. Pre-created Products/Prices reused forever. No client-side tier syncing.

**Tech Stack:** Stripe Checkout API, Stripe Webhooks, Stripe Customer Portal, Drizzle ORM, PostgreSQL

---

## Phase 1: Stripe Dashboard Setup

### Task 1: Create Stripe Products and Prices

**Manual Steps (Stripe Dashboard):**

1. Go to https://dashboard.stripe.com/test/products
2. Click "Add product"
3. Create Product 1:
   - Name: "Premium"
   - Description: "Unlimited personalized bedtime stories for your little one"
   - Click "Add pricing"
   - Price 1: $6.99 USD, Recurring: Monthly
   - Click "Add another price"
   - Price 2: $59.00 USD, Recurring: Yearly
   - Click "Save product"

4. Click "Add product" again
5. Create Product 2:
   - Name: "Family"
   - Description: "Ultimate storytelling experience for families with multiple children"
   - Click "Add pricing"
   - Price 1: $12.99 USD, Recurring: Monthly
   - Click "Add another price"
   - Price 2: $119.00 USD, Recurring: Yearly
   - Click "Save product"

6. For each price, click on it and note the Price ID (starts with `price_`)

7. Add metadata to each price:
   - Premium Monthly: Add metadata `tier` = `premium`
   - Premium Yearly: Add metadata `tier` = `premium`
   - Family Monthly: Add metadata `tier` = `family`
   - Family Yearly: Add metadata `tier` = `family`

**Expected Result:** 2 Products, 4 Prices with metadata set

---

### Task 2: Configure Stripe Customer Portal

**Manual Steps (Stripe Dashboard):**

1. Go to https://dashboard.stripe.com/test/settings/billing/portal
2. Click "Activate test link"
3. Under "Features":
   - ✅ Enable "Customer can cancel subscriptions"
   - ✅ Enable "Customer can update subscriptions" (for plan changes)
   - ✅ Enable "Customer can update payment methods"
4. Under "Business information":
   - Set return URL: `http://localhost:5000/dashboard` (for local dev)
5. Click "Save changes"

**Expected Result:** Customer Portal configured and active

---

### Task 3: Update Environment Variables

**Files:**
- Modify: `.env`

**Step 1: Add Stripe Price IDs to .env**

```bash
# Add these lines (replace with your actual Price IDs from Task 1)
STRIPE_PRICE_PREMIUM_MONTHLY=price_xxxxxxxxx
STRIPE_PRICE_PREMIUM_YEARLY=price_xxxxxxxxx
STRIPE_PRICE_FAMILY_MONTHLY=price_xxxxxxxxx
STRIPE_PRICE_FAMILY_YEARLY=price_xxxxxxxxx
```

**Step 2: Verify environment variables are set**

Run:
```bash
node -e "require('dotenv').config(); console.log(process.env.STRIPE_PRICE_PREMIUM_MONTHLY)"
```

Expected: Your Price ID printed (not undefined)

**Step 3: Commit**

```bash
git add .env
git commit -m "chore: add Stripe Price IDs to environment"
```

---

## Phase 2: Database Schema Changes

### Task 4: Add Webhook Event Tracking Table

**Files:**
- Modify: `shared/schema.ts`

**Step 1: Add processedStripeEvents table definition**

Add after the existing tables (around line 100):

```typescript
export const processedStripeEvents = pgTable("processed_stripe_events", {
  eventId: varchar("event_id", { length: 255 }).primaryKey(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  processedAt: timestamp("processed_at").defaultNow().notNull(),
});
```

**Step 2: Type-check the schema**

Run:
```bash
npm run check
```

Expected: No TypeScript errors

**Step 3: Push schema to database**

Run:
```bash
npm run db:push
```

Expected: "✓ Pushing changes to database..." then success message

**Step 4: Verify table was created**

Run:
```bash
psql $DATABASE_URL -c "\d processed_stripe_events"
```

Expected: Table structure displayed with event_id, event_type, processed_at columns

**Step 5: Commit**

```bash
git add shared/schema.ts
git commit -m "feat: add processed_stripe_events table for webhook idempotency"
```

---

## Phase 3: Backend - Payment Routes

### Task 5: Add Validation Schema for Checkout

**Files:**
- Modify: `server/inputValidation.ts`

**Step 1: Add checkout session schema**

Add near the other schemas (around line 50):

```typescript
export const checkoutSessionSchema = z.object({
  tier: z.enum(["premium", "family"]),
  billing: z.enum(["monthly", "yearly"]),
});
```

**Step 2: Type-check**

Run:
```bash
npm run check
```

Expected: No errors

**Step 3: Commit**

```bash
git add server/inputValidation.ts
git commit -m "feat: add checkout session validation schema"
```

---

### Task 6: Rewrite Payment Routes

**Files:**
- Modify: `server/routes/payments.ts`

**Step 1: Replace entire file contents**

Replace the entire contents of `server/routes/payments.ts` with:

```typescript
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
          success_url: `${process.env.BETTER_AUTH_BASE_URL}/dashboard?payment=success`,
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
          return_url: `${process.env.BETTER_AUTH_BASE_URL}/dashboard`,
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
```

**Step 2: Type-check**

Run:
```bash
npm run check
```

Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add server/routes/payments.ts server/inputValidation.ts
git commit -m "feat: replace subscription creation with Stripe Checkout flow"
```

---

## Phase 4: Backend - Webhook Handler

### Task 7: Rewrite Webhook Handler with Idempotency

**Files:**
- Modify: `server/routes/webhooks.ts`

**Step 1: Import processedStripeEvents schema**

At the top of `server/routes/webhooks.ts`, update imports:

```typescript
import type { Express } from "express";
import Stripe from "stripe";
import { db } from "../db";
import { users, processedStripeEvents } from "@shared/schema";
import { eq } from "drizzle-orm";
```

**Step 2: Replace webhook handler function**

Replace the entire `registerWebhookRoutes` function with:

```typescript
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
          const invoice = event.data.object as Stripe.Invoice;
          if (!invoice.subscription) break;

          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
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
```

**Step 3: Type-check**

Run:
```bash
npm run check
```

Expected: No TypeScript errors

**Step 4: Commit**

```bash
git add server/routes/webhooks.ts
git commit -m "feat: rewrite webhook handler with idempotency and improved tier detection"
```

---

## Phase 5: Frontend - Dashboard Updates

### Task 8: Add Upgrade and Manage Buttons to Dashboard

**Files:**
- Modify: `client/src/pages/dashboard.tsx`

**Step 1: Add imports at top of file**

Add these imports after existing imports (around line 10):

```typescript
import { useMutation } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";
```

**Step 2: Add mutation hooks inside Dashboard component**

Add after the `useTierInfo()` hook (around line 30):

```typescript
  // Mutation to create checkout session
  const createCheckout = useMutation({
    mutationFn: async ({ tier, billing }: { tier: string; billing: string }) => {
      const res = await apiRequest("/api/create-checkout-session", "POST", { tier, billing });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create checkout");
      }
      const data = await res.json();
      return data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Checkout Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to create portal session
  const createPortal = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/create-portal-session", "POST", {});
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create portal session");
      }
      const data = await res.json();
      return data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Portal Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
```

**Step 3: Add payment success alert**

Add near the top of the JSX return (before the main content, around line 50):

```typescript
      {/* Payment Success Alert */}
      {new URLSearchParams(window.location.search).get("payment") === "success" && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Payment Successful!</AlertTitle>
          <AlertDescription className="text-green-700">
            Your premium features are now unlocked. Enjoy unlimited personalized bedtime stories!
          </AlertDescription>
        </Alert>
      )}
```

**Step 4: Add upgrade CTA for free users**

Add before the story library section (around line 60):

```typescript
      {/* Upgrade CTA for Free Users */}
      {tierInfo.tier === "free" && (
        <Card className="mb-8 border-story-gold/20 bg-gradient-to-br from-story-cream to-story-mist">
          <CardHeader>
            <CardTitle className="font-serif text-2xl text-story-bark">
              Unlock Unlimited Stories
            </CardTitle>
            <CardDescription className="text-story-bark/70">
              Upgrade to Premium for unlimited personalized bedtime stories
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => createCheckout.mutate({ tier: "premium", billing: "monthly" })}
              disabled={createCheckout.isPending}
              className="flex-1"
            >
              {createCheckout.isPending ? "Loading..." : "Premium - $6.99/month"}
            </Button>
            <Button
              variant="outline"
              onClick={() => createCheckout.mutate({ tier: "family", billing: "monthly" })}
              disabled={createCheckout.isPending}
              className="flex-1"
            >
              {createCheckout.isPending ? "Loading..." : "Family - $12.99/month"}
            </Button>
          </CardContent>
        </Card>
      )}
```

**Step 5: Add manage subscription button for paid users**

Add in the header area where tier badge is shown (around line 40):

```typescript
      {/* Manage Subscription for Paid Users */}
      {(tierInfo.tier === "premium" || tierInfo.tier === "family") && (
        <Button
          variant="outline"
          onClick={() => createPortal.mutate()}
          disabled={createPortal.isPending}
          className="ml-auto"
        >
          {createPortal.isPending ? "Loading..." : "Manage Subscription"}
        </Button>
      )}
```

**Step 6: Remove old tier sync logic**

Find and DELETE these lines (around line 117-127 in subscribe.tsx logic if it exists in dashboard):

```typescript
// DELETE THESE LINES if present:
// Force sync with Stripe to update tier immediately
try {
  await fetch("/api/subscription-status", {
    method: "GET",
    credentials: "include",
  });
} catch (syncError) {
  console.warn("Tier sync failed, webhook will handle:", syncError);
}
```

**Step 7: Type-check**

Run:
```bash
npm run check
```

Expected: No TypeScript errors

**Step 8: Test in browser (manual)**

Run:
```bash
npm run dev
```

Visit `http://localhost:5000/dashboard`

Expected:
- Free users see upgrade CTA
- Paid users see "Manage Subscription" button
- No console errors

**Step 9: Commit**

```bash
git add client/src/pages/dashboard.tsx
git commit -m "feat: add upgrade and manage subscription UI to dashboard"
```

---

## Phase 6: Frontend - Pricing Page Updates

### Task 9: Update Pricing Page CTAs

**Files:**
- Modify: `client/src/pages/pricing.tsx`

**Step 1: Add mutation hook**

Add after the `useAuth()` hook (around line 15):

```typescript
  const createCheckout = useMutation({
    mutationFn: async ({ tier, billing }: { tier: string; billing: string }) => {
      const res = await apiRequest("/api/create-checkout-session", "POST", { tier, billing });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create checkout");
      }
      const data = await res.json();
      return data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Checkout Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
```

**Step 2: Update "Get Started" button logic**

Find the pricing card buttons (around line 100+) and update them:

```typescript
<Button
  size="lg"
  className="w-full"
  onClick={() => {
    if (!user) {
      // Not logged in - redirect to signup
      window.location.href = "/api/login?signup=true";
    } else {
      // Logged in - start checkout
      createCheckout.mutate({
        tier: "premium", // or "family" depending on which card
        billing: selectedBilling
      });
    }
  }}
  disabled={createCheckout.isPending}
>
  {createCheckout.isPending
    ? "Loading..."
    : user
      ? "Upgrade Now"
      : "Sign Up Free"}
</Button>
```

Repeat for the Family tier button.

**Step 3: Type-check**

Run:
```bash
npm run check
```

Expected: No TypeScript errors

**Step 4: Commit**

```bash
git add client/src/pages/pricing.tsx
git commit -m "feat: update pricing page to trigger Stripe Checkout"
```

---

## Phase 7: Cleanup - Remove Old Files

### Task 10: Delete Unused Pages

**Files:**
- Delete: `client/src/pages/subscribe.tsx`
- Delete: `client/src/pages/checkout.tsx` (if exists)

**Step 1: Remove subscribe.tsx**

Run:
```bash
rm client/src/pages/subscribe.tsx
```

Expected: File deleted

**Step 2: Remove checkout.tsx if it exists**

Run:
```bash
rm -f client/src/pages/checkout.tsx
```

Expected: File deleted (or doesn't exist - both OK)

**Step 3: Check for route references**

Run:
```bash
grep -r "subscribe" client/src --include="*.tsx" --include="*.ts"
```

Expected: No references to `/subscribe` route (except maybe in comments)

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove obsolete subscribe and checkout pages"
```

---

## Phase 8: Testing & Verification

### Task 11: Local Webhook Testing Setup

**Prerequisites:** Install Stripe CLI from https://stripe.com/docs/stripe-cli

**Step 1: Login to Stripe CLI**

Run:
```bash
stripe login
```

Expected: Browser opens, you authorize, CLI says "Done!"

**Step 2: Start webhook forwarding**

In a separate terminal:
```bash
stripe listen --forward-to localhost:5000/api/stripe/webhook
```

Expected: "Ready! Your webhook signing secret is whsec_..." (copy this secret)

**Step 3: Update .env with webhook secret**

Add to `.env`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxx
```

**Step 4: Restart dev server**

Kill and restart:
```bash
npm run dev
```

Expected: Server starts, no errors about missing STRIPE_WEBHOOK_SECRET

---

### Task 12: End-to-End Flow Test

**Step 1: Sign up as new user**

1. Visit `http://localhost:5000`
2. Click "Sign Up"
3. Create account with email/password
4. Should redirect to `/dashboard`
5. Should see "Unlock Unlimited Stories" upgrade CTA

**Step 2: Verify user is free tier**

Run:
```bash
psql $DATABASE_URL -c "SELECT email, \"subscriptionTier\", \"subscriptionStatus\" FROM users ORDER BY \"createdAt\" DESC LIMIT 1;"
```

Expected:
```
         email         | subscriptionTier | subscriptionStatus
-----------------------+------------------+--------------------
 test@example.com     | free             | active
```

**Step 3: Initiate upgrade**

1. Click "Premium - $6.99/month" button
2. Should redirect to Stripe Checkout page
3. Fill in test card: `4242 4242 4242 4242`, any future date, any CVC
4. Click "Subscribe"
5. Should redirect back to `/dashboard?payment=success`
6. Should see green "Payment Successful!" alert
7. Should see "Manage Subscription" button

**Step 4: Check webhook fired**

In the terminal running `stripe listen`, you should see:
```
checkout.session.completed [evt_xxx]
```

**Step 5: Verify tier updated in database**

Run:
```bash
psql $DATABASE_URL -c "SELECT email, \"subscriptionTier\", \"subscriptionStatus\" FROM users WHERE email = 'test@example.com';"
```

Expected:
```
         email         | subscriptionTier | subscriptionStatus
-----------------------+------------------+--------------------
 test@example.com     | premium          | active
```

**Step 6: Test Customer Portal**

1. Click "Manage Subscription" button
2. Should redirect to Stripe Customer Portal
3. Click "Cancel plan"
4. Confirm cancellation
5. Should redirect back to `/dashboard`

**Step 7: Verify cancellation webhook**

Check `stripe listen` output:
```
customer.subscription.deleted [evt_xxx]
```

**Step 8: Verify tier downgraded**

Run:
```bash
psql $DATABASE_URL -c "SELECT email, \"subscriptionTier\", \"subscriptionStatus\" FROM users WHERE email = 'test@example.com';"
```

Expected:
```
         email         | subscriptionTier | subscriptionStatus
-----------------------+------------------+--------------------
 test@example.com     | free             | canceled
```

---

### Task 13: Test Webhook Idempotency

**Step 1: Trigger test webhook**

Run:
```bash
stripe trigger checkout.session.completed
```

Expected: "Triggering checkout.session.completed event..."

**Step 2: Check processed events table**

Run:
```bash
psql $DATABASE_URL -c "SELECT \"eventId\", \"eventType\", \"processedAt\" FROM processed_stripe_events ORDER BY \"processedAt\" DESC LIMIT 5;"
```

Expected: Events listed with their IDs and processing timestamps

**Step 3: Replay the same event**

Get the event ID from step 2, then:
```bash
stripe events resend evt_xxxxx
```

**Step 4: Check logs**

In the terminal running `npm run dev`, you should see:
```
Event evt_xxxxx already processed at [timestamp], skipping
```

**Step 5: Verify no duplicate processing**

Run:
```bash
psql $DATABASE_URL -c "SELECT \"eventId\", COUNT(*) FROM processed_stripe_events GROUP BY \"eventId\" HAVING COUNT(*) > 1;"
```

Expected: No rows (no duplicates)

---

## Phase 9: Production Deployment

### Task 14: Configure Production Stripe Webhook

**Manual Steps (Stripe Dashboard - Production Mode):**

1. Switch to Live mode in Stripe Dashboard
2. Create Products and Prices (same as Task 1, but in Live mode)
3. Add metadata `tier` to each Price
4. Go to https://dashboard.stripe.com/webhooks
5. Click "Add endpoint"
6. Enter URL: `https://yourdomain.com/api/stripe/webhook`
7. Select events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
8. Click "Add endpoint"
9. Copy the Signing Secret (starts with `whsec_`)

**Expected Result:** Webhook endpoint configured in production

---

### Task 15: Update Production Environment Variables

**Step 1: Add production Price IDs**

In your hosting platform (Railway, Vercel, etc.), add these env vars:

```bash
STRIPE_PRICE_PREMIUM_MONTHLY=price_live_xxxxxxxxx
STRIPE_PRICE_PREMIUM_YEARLY=price_live_xxxxxxxxx
STRIPE_PRICE_FAMILY_MONTHLY=price_live_xxxxxxxxx
STRIPE_PRICE_FAMILY_YEARLY=price_live_xxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_live_xxxxxxxxx
```

**Step 2: Deploy**

Run:
```bash
npm run build
```

Expected: Build succeeds

Push to production:
```bash
git push origin main
```

Expected: Deployment triggers

**Step 3: Verify webhook is receiving events**

In Stripe Dashboard → Webhooks → Click on your endpoint → "Events" tab

Expected: Events start appearing as users subscribe/cancel

---

## Success Checklist

Run through this checklist to verify everything works:

- [ ] User can sign up for free account
- [ ] Free user sees upgrade CTA on dashboard
- [ ] Clicking upgrade redirects to Stripe Checkout
- [ ] Payment with test card succeeds
- [ ] Webhook fires and updates tier in database
- [ ] User redirected to dashboard with success message
- [ ] Premium features are unlocked (unlimited stories, PDF download)
- [ ] Manage Subscription button appears for paid users
- [ ] Customer Portal allows cancellation
- [ ] Cancellation webhook fires and downgrades to free
- [ ] Webhook events are not processed twice (idempotency)
- [ ] No console errors in browser or server
- [ ] TypeScript compiles without errors (`npm run check`)
- [ ] Production webhook endpoint is configured
- [ ] Production environment variables are set

---

## Rollback Plan

If something goes wrong in production:

**Step 1: Revert code changes**

```bash
git revert HEAD~N  # Where N is number of commits to revert
git push origin main
```

**Step 2: Keep Stripe resources**

- Leave Products/Prices as-is (they don't hurt anything)
- Keep webhooks configured (no harm if old code ignores them)

**Step 3: Restore database if needed**

If processed_stripe_events table causes issues:

```bash
psql $DATABASE_URL -c "DROP TABLE IF EXISTS processed_stripe_events;"
```

Then revert schema.ts change.

---

**Plan Complete.** Ready for execution.
