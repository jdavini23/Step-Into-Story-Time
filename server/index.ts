import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Security headers middleware
app.use((req, res, next) => {
  // Prevent XSS attacks
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // Referrer Policy - control referrer information
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy - control browser features
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );

  // Cross-Origin Opener Policy
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");

  // Strict Transport Security (only for HTTPS)
  if (req.secure || req.headers["x-forwarded-proto"] === "https") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }

  // Enhanced Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://m.stripe.network https://auth.util.repl.co https://replit.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.stripe.com https://m.stripe.network https://r.stripe.com https://replit.com https://*.replit.com wss:",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://auth.util.repl.co",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  res.setHeader("Content-Security-Policy", cspDirectives.join("; "));

  // Remove server information
  res.removeHeader("X-Powered-By");

  next();
});

app.use(express.json({ limit: "10mb" })); // Limit request size
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Import validation functions
import { validateCSRFToken, generateCSRFToken } from "./inputValidation";

// CSRF token endpoint will be handled in routes.ts after auth setup

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Import error handling utilities
import {
  globalErrorHandler,
  notFoundHandler,
  setupProcessErrorHandlers,
} from "./errorHandler";

// Import authentication setup
import { setupAuth } from "./replitAuth";

(async () => {
  // Setup authentication BEFORE registering routes
  await setupAuth(app);

  const server = await registerRoutes(app);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Setup process-level error handlers
  setupProcessErrorHandlers();

  // 404 handler for unmatched routes (must be after all other routes)
  app.use(notFoundHandler);

  // Global error handling middleware (must be last)
  app.use(globalErrorHandler);

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
