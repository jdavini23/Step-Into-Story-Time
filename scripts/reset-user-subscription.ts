#!/usr/bin/env tsx
/**
 * Reset User Subscription
 *
 * Clears subscription data for testing purposes
 */

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { users } from "../shared/schema.js";

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function resetSubscriptions() {
  console.log("🔄 Resetting all user subscriptions to free tier...\n");

  const result = await db
    .update(users)
    .set({
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionTier: "free",
      subscriptionStatus: "active",
    })
    .returning({ email: users.email, id: users.id });

  console.log(`✅ Reset ${result.length} user(s):\n`);
  result.forEach((user) => {
    console.log(`   • ${user.email || user.id}`);
  });

  console.log("\n💡 You can now test subscription flow with a clean slate!");
}

resetSubscriptions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error resetting subscriptions:", error.message);
    process.exit(1);
  });
