import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "@shared/schema";

// Validate required environment variables at startup
const requiredEnv = {
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
};
for (const [key, value] of Object.entries(requiredEnv)) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}
const authSecret = process.env.BETTER_AUTH_SECRET as string;
const googleClientId = process.env.GOOGLE_CLIENT_ID as string;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET as string;

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_BASE_URL ?? process.env.TRUSTED_ORIGINS?.split(",")[0],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.betterAuthSessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    // TODO: set to true once SMTP/email delivery is configured
    requireEmailVerification: false,
  },
  socialProviders: {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    },
  },
  user: {
    additionalFields: {
      subscriptionTier: { type: "string", defaultValue: "free", required: false },
      subscriptionStatus: { type: "string", defaultValue: "active", required: false },
      stripeCustomerId: { type: "string", required: false },
      stripeSubscriptionId: { type: "string", required: false },
      firstName: { type: "string", required: false },
      lastName: { type: "string", required: false },
      profileImageUrl: { type: "string", required: false },
    },
  },
  trustedOrigins: process.env.TRUSTED_ORIGINS?.split(",") ?? [],
  secret: authSecret,
});
