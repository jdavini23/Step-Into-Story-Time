#!/usr/bin/env tsx
/**
 * Setup Stripe Products and Prices
 *
 * This script creates the subscription products and prices in your Stripe account.
 * Run this once before enabling subscriptions in your app.
 *
 * Usage: npx tsx scripts/setup-stripe-products.ts
 */

import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("❌ STRIPE_SECRET_KEY environment variable is required");
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-05-28.basil",
});

// Pricing configuration (matches server/routes/payments.ts)
const PRODUCTS = [
  {
    name: "Premium",
    description: "Unlimited stories, PDF downloads, all themes and lengths, AI illustrations",
    prices: [
      { amount: 699, interval: "month" as const, nickname: "Premium Monthly" },
      { amount: 5900, interval: "year" as const, nickname: "Premium Yearly" },
    ],
  },
  {
    name: "Family",
    description: "Everything in Premium plus custom characters, 5 child profiles, audio narration",
    prices: [
      { amount: 1299, interval: "month" as const, nickname: "Family Monthly" },
      { amount: 11900, interval: "year" as const, nickname: "Family Yearly" },
    ],
  },
];

async function setupStripeProducts() {
  console.log("🚀 Setting up Stripe products and prices...\n");

  for (const productConfig of PRODUCTS) {
    console.log(`📦 Creating product: ${productConfig.name}`);

    // Check if product already exists
    const existingProducts = await stripe.products.search({
      query: `name:'${productConfig.name}' AND active:'true'`,
    });

    let product: Stripe.Product;

    if (existingProducts.data.length > 0) {
      product = existingProducts.data[0];
      console.log(`   ✓ Product already exists (${product.id})`);
    } else {
      product = await stripe.products.create({
        name: productConfig.name,
        description: productConfig.description,
        metadata: {
          tier: productConfig.name.toLowerCase(),
        },
      });
      console.log(`   ✓ Created product (${product.id})`);
    }

    // Create prices for this product
    for (const priceConfig of productConfig.prices) {
      const priceAmount = (priceConfig.amount / 100).toFixed(2);
      const interval = priceConfig.interval;

      console.log(`   💵 Creating price: $${priceAmount}/${interval}`);

      // Check if price already exists
      const existingPrices = await stripe.prices.list({
        product: product.id,
        active: true,
      });

      const matchingPrice = existingPrices.data.find(
        (p) =>
          p.unit_amount === priceConfig.amount &&
          p.recurring?.interval === interval
      );

      if (matchingPrice) {
        console.log(`      ✓ Price already exists (${matchingPrice.id})`);
      } else {
        const price = await stripe.prices.create({
          product: product.id,
          currency: "usd",
          unit_amount: priceConfig.amount,
          recurring: { interval: priceConfig.interval },
          nickname: priceConfig.nickname,
          metadata: {
            tier: productConfig.name.toLowerCase(),
            billing: interval,
          },
        });
        console.log(`      ✓ Created price (${price.id})`);
      }
    }

    console.log("");
  }

  console.log("✅ Stripe setup complete!\n");
  console.log("📋 Summary:");
  console.log("   • Premium Monthly: $6.99/month");
  console.log("   • Premium Yearly: $59.00/year (Save $25/year)");
  console.log("   • Family Monthly: $12.99/month");
  console.log("   • Family Yearly: $119.00/year (Save $37/year)");
  console.log("\n💡 You can now test subscriptions in your app!");
}

setupStripeProducts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error setting up Stripe products:", error.message);
    process.exit(1);
  });
