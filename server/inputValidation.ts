import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";
import { randomBytes, timingSafeEqual } from "crypto";

// HTML sanitization configuration
const sanitizeConfig = {
  ALLOWED_TAGS: [], // No HTML tags allowed by default
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true, // Keep text content, remove HTML tags
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
};

// Strict sanitization for user inputs (removes all HTML)
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }

  // Remove all HTML tags and decode entities
  const sanitized = DOMPurify.sanitize(input, sanitizeConfig);

  // Additional cleaning: remove potential script content
  return sanitized
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

// Sanitize story content (allows some safe formatting)
export function sanitizeStoryContent(content: string): string {
  if (typeof content !== 'string') {
    throw new Error('Content must be a string');
  }

  const storyConfig = {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'i', 'b'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
  };

  return DOMPurify.sanitize(content, storyConfig);
}

// Validate and sanitize child name
export const childNameSchema = z
  .string()
  .min(1, "Child name is required")
  .max(50, "Child name must be 50 characters or less")
  .regex(/^[a-zA-Z\s\-']+$/, "Child name can only contain letters, spaces, hyphens, and apostrophes")
  .transform(sanitizeText);

// Validate and sanitize themes
export const themesSchema = z
  .string()
  .max(200, "Themes must be 200 characters or less")
  .refine((val) => val === "" || /^[a-zA-Z\s,\-']+$/.test(val), "Themes can only contain letters, spaces, commas, hyphens, and apostrophes")
  .transform((val) => val === "" ? undefined : sanitizeText(val))
  .optional();

// Validate and sanitize bedtime message
export const bedtimeMessageSchema = z
  .string()
  .max(500, "Bedtime message must be 500 characters or less")
  .transform((val) => val === "" ? undefined : sanitizeText(val))
  .optional();

// Validate story title
export const storyTitleSchema = z
  .string()
  .min(1, "Title is required")
  .max(100, "Title must be 100 characters or less")
  .transform(sanitizeText);

// Validate story content
export const storyContentSchema = z
  .string()
  .min(1, "Story content is required")
  .max(10000, "Story content must be 10000 characters or less")
  .transform(sanitizeStoryContent);

// Comprehensive story validation schema
export const sanitizedStorySchema = z.object({
  childName: childNameSchema,
  childAge: z.number().int().min(2).max(8),
  childGender: z.enum(['boy', 'girl']),
  favoriteThemes: themesSchema,
  tone: z.enum(['adventurous', 'silly', 'calming', 'educational']),
  length: z.enum(['short', 'medium', 'long']),
  storyTemplate: z.string().optional(),
  bedtimeMessage: bedtimeMessageSchema,
  title: storyTitleSchema.optional(),
  content: storyContentSchema.optional(),
}).strict();

// Rate limiting helper
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(
    private maxRequests: number = 10,
    private windowMs: number = 60000 // 1 minute
  ) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];

    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }
}

// Input validation middleware
export function validateInput<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    try {
      console.log("Validating request body:", JSON.stringify(req.body, null, 2));
      req.validatedBody = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation failed:", error.errors);
        return res.status(400).json({
          message: "Input validation failed",
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
          requestBody: req.body,
        });
      }
      console.error("Validation error:", error);
      return res.status(400).json({ message: "Invalid input" });
    }
  };
}

// In-memory CSRF token store keyed by user ID (replaces session-based storage)
const CSRF_TTL_MS = 60 * 60 * 1000; // 1 hour
interface CsrfEntry { token: string; expiresAt: number; }
const csrfTokenStore = new Map<string, CsrfEntry>();

// Purge expired entries periodically to prevent unbounded growth
setInterval(() => {
  const now = Date.now();
  csrfTokenStore.forEach((entry, userId) => {
    if (entry.expiresAt <= now) csrfTokenStore.delete(userId);
  });
}, 15 * 60 * 1000); // run every 15 minutes

export function storeCsrfToken(userId: string, token: string): void {
  csrfTokenStore.set(userId, { token, expiresAt: Date.now() + CSRF_TTL_MS });
}

// CSRF protection helper
export function validateCSRFToken(req: any, res: any, next: any) {
  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const userId = req.user?.claims?.sub;

  if (!token) {
    return res.status(403).json({
      message: "CSRF token required",
      code: "CSRF_TOKEN_MISSING"
    });
  }

  if (!userId) {
    return res.status(403).json({
      message: "Invalid session - CSRF token not found",
      code: "CSRF_SESSION_INVALID"
    });
  }

  const entry = csrfTokenStore.get(userId);
  if (!entry || entry.expiresAt <= Date.now()) {
    csrfTokenStore.delete(userId);
    return res.status(403).json({
      message: "Invalid CSRF token",
      code: "CSRF_TOKEN_INVALID"
    });
  }

  // Timing-safe comparison to prevent timing attacks
  const incoming = Buffer.from(String(token));
  const stored = Buffer.from(entry.token);
  if (incoming.length !== stored.length || !timingSafeEqual(incoming, stored)) {
    return res.status(403).json({
      message: "Invalid CSRF token",
      code: "CSRF_TOKEN_INVALID"
    });
  }

  // Delete after successful validation to prevent replay attacks
  csrfTokenStore.delete(userId);
  next();
}

// Generate CSRF token
export function generateCSRFToken(): string {
  return randomBytes(32).toString("hex");
}

export const paymentIntentSchema = z.object({
  amount: z.number().positive("Amount must be a positive number"),
});

export const subscriptionSchema = z.object({
  tier: z.enum(['premium', 'family']),
  billing: z.enum(['monthly', 'yearly']),
});