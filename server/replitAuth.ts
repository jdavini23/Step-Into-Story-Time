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
      secure: process.env.NODE_ENV === 'production',
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

  const domains = process.env.REPLIT_DOMAINS ? process.env.REPLIT_DOMAINS.split(",") : [];
  
  // Add development domains
  if (process.env.NODE_ENV === 'development') {
    domains.push('localhost:5000', 'localhost');
  }
  
  // Always add current Replit workspace domain if available
  if (process.env.REPL_ID) {
    // Get the current domain from various possible environment variables
    const currentDomain = process.env.REPLIT_DEV_DOMAIN || 
                         process.env.REPL_SLUG || 
                         `${process.env.REPL_ID}.${process.env.REPL_OWNER || 'unknown'}.replit.dev`;
    
    if (currentDomain && !domains.includes(currentDomain)) {
      domains.push(currentDomain);
    }
    
    // Also try to construct the full replit.dev domain
    if (process.env.REPL_OWNER) {
      const replitDomain = `${process.env.REPL_ID}.${process.env.REPL_OWNER}.replit.dev`;
      if (!domains.includes(replitDomain)) {
        domains.push(replitDomain);
      }
    }
  }
  
  console.log('Registering authentication strategies for domains:', domains);
  
  for (const domain of domains) {
    const isLocalhost = domain.includes('localhost');
    const protocol = isLocalhost ? 'http' : 'https';
    
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `${protocol}://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    // Store signup intent and return URL in session if present
    if (req.query.signup === "true") {
      req.session.isSignup = true;
    }
    if (req.query.returnTo) {
      req.session.returnTo = req.query.returnTo;
    }

    const strategyName = `replitauth:${req.hostname}`;
    
    // Check if strategy exists, if not try to find a matching one
    const availableStrategies = Object.keys(passport._strategies || {});
    let targetStrategy = strategyName;
    
    if (!availableStrategies.includes(strategyName)) {
      console.log(`Strategy ${strategyName} not found. Available strategies:`, availableStrategies);
      
      // Try to find a similar strategy
      const replitStrategies = availableStrategies.filter(s => s.startsWith('replitauth:'));
      if (replitStrategies.length > 0) {
        targetStrategy = replitStrategies[0];
        console.log(`Using fallback strategy: ${targetStrategy}`);
      } else {
        return res.status(500).json({ 
          error: 'Authentication not configured properly',
          message: 'No authentication strategies available'
        });
      }
    }

    passport.authenticate(targetStrategy, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    const strategyName = `replitauth:${req.hostname}`;
    
    // Check if strategy exists, if not try to find a matching one
    const availableStrategies = Object.keys(passport._strategies || {});
    let targetStrategy = strategyName;
    
    if (!availableStrategies.includes(strategyName)) {
      const replitStrategies = availableStrategies.filter(s => s.startsWith('replitauth:'));
      if (replitStrategies.length > 0) {
        targetStrategy = replitStrategies[0];
      }
    }
    
    passport.authenticate(targetStrategy, (err, user) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.redirect("/api/login");
      }

      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }

        // Redirect to stored returnTo URL or default to dashboard
        const returnTo = req.session.returnTo || "/";
        delete req.session.returnTo; // Clean up
        delete req.session.isSignup; // Clean up

        return res.redirect(returnTo);
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