import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!,
    );
  },
  { maxAge: 3600 * 1000 },
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback,
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Store registered strategies in a variable accessible to route handlers
  let registeredStrategies: string[] = [];
  
  for (const domainEntry of process.env.REPLIT_DOMAINS!.split(",")) {
    // Clean up domain entry - remove protocol and trailing slash
    const domain = domainEntry.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const strategyName = `replitauth:${domain}`;
    
    const strategy = new Strategy(
      {
        name: strategyName,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
    registeredStrategies.push(strategyName);
  }
  
  console.log("Registered authentication strategies:", registeredStrategies);

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    // Store signup intent and return URL in session if present
    if (req.query.signup === "true") {
      (req.session as any).isSignup = true;
    }
    if (req.query.returnTo) {
      (req.session as any).returnTo = req.query.returnTo;
      console.log(`Storing returnTo URL in session: ${req.query.returnTo}`);
    }

    // Find the correct strategy by checking if it's registered
    let strategyName = `replitauth:${req.hostname}`;
    console.log(`Attempting authentication with strategy: ${strategyName}`);
    console.log(`Request hostname: ${req.hostname}`);
    console.log(`Available domains: ${process.env.REPLIT_DOMAINS}`);
    console.log(`Registered strategies: ${JSON.stringify(registeredStrategies)}`);
    console.log(`Strategy exists check: ${registeredStrategies.includes(strategyName)}`);

    // If the exact hostname strategy doesn't exist, use the first registered strategy
    if (!registeredStrategies.includes(strategyName)) {
      console.log(`Strategy ${strategyName} not found, using first available: ${registeredStrategies[0]}`);
      strategyName = registeredStrategies[0];
    }

    if (!strategyName || !registeredStrategies.includes(strategyName)) {
      console.error("No valid authentication strategy found");
      console.error(`Final strategy name: ${strategyName}`);
      console.error(`Registered strategies: ${JSON.stringify(registeredStrategies)}`);
      return res.status(500).json({ message: "Authentication not configured" });
    }

    try {
      passport.authenticate(strategyName, {
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);
    } catch (error) {
      console.error("Passport authentication error:", error);
      res.status(500).json({ message: "Authentication failed", error: error.message });
    }
  });

  app.get("/api/callback", (req, res, next) => {
    let strategyName = `replitauth:${req.hostname}`;
    console.log(`Callback authentication with strategy: ${strategyName}`);
    
    // If the exact hostname strategy doesn't exist, use the first registered strategy
    if (!registeredStrategies.includes(strategyName)) {
      console.log(`Callback strategy ${strategyName} not found, using first available: ${registeredStrategies[0]}`);
      strategyName = registeredStrategies[0];
    }
    
    passport.authenticate(strategyName, async (err: any, user: any) => {
      if (err) {
        console.error("Authentication error:", err);
        return next(err);
      }
      if (!user) {
        console.log("No user returned from authentication");
        return res.redirect("/api/login");
      }

      req.logIn(user, async (err) => {
        if (err) {
          return next(err);
        }

        try {
          // Ensure new users start with free tier
          const userId = user.claims?.sub;
          if (userId) {
            const existingUser = await storage.getUser(userId);
            if (existingUser && !existingUser.subscriptionTier) {
              await storage.updateUserSubscription(userId, "free", "active");
              console.log(`Set new user ${userId} to free tier`);
            }
          }

          // Redirect to stored returnTo URL or default to dashboard
          const returnTo = (req.session as any).returnTo || "/";
          const isSignup = (req.session as any).isSignup;
          
          console.log(`Authentication successful - redirecting to: ${returnTo}`);
          console.log(`Was signup flow: ${isSignup}`);
          
          delete (req.session as any).returnTo; // Clean up
          delete (req.session as any).isSignup; // Clean up

          return res.redirect(returnTo);
        } catch (error) {
          console.error("Error during callback processing:", error);
          return res.redirect("/");
        }
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href,
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};