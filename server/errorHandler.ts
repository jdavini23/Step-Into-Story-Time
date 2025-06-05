import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

// Custom error classes for better error categorization
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "AUTHENTICATION_ERROR");
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Insufficient permissions") {
    super(message, 403, "AUTHORIZATION_ERROR");
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests") {
    super(message, 429, "RATE_LIMIT_ERROR");
    this.name = "RateLimitError";
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = "Database operation failed") {
    super(message, 500, "DATABASE_ERROR");
    this.name = "DatabaseError";
  }
}

// Error logging utility
class ErrorLogger {
  private static instance: ErrorLogger;

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  log(error: Error, req?: Request, additionalInfo?: any) {
    const timestamp = new Date().toISOString();
    const userId = (req as any)?.user?.claims?.sub || "anonymous";
    const userAgent = req?.headers["user-agent"] || "unknown";
    const ip = req?.ip || req?.connection?.remoteAddress || "unknown";

    const errorInfo = {
      timestamp,
      userId,
      userAgent,
      ip,
      url: req?.url,
      method: req?.method,
      error: {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
        code: (error as AppError).code,
        statusCode: (error as AppError).statusCode,
      },
      additionalInfo,
    };

    // Log to console (in production, you might want to use a proper logging service)
    console.error("Application Error:", JSON.stringify(errorInfo, null, 2));

    // In production, you could send this to external logging services like:
    // - Sentry
    // - LogRocket
    // - DataDog
    // - CloudWatch
  }
}

// Error response formatter
export function formatErrorResponse(error: Error, req: Request) {
  const logger = ErrorLogger.getInstance();
  logger.log(error, req);

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === "development";

  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        timestamp: new Date().toISOString(),
        ...(isDevelopment && { stack: error.stack }),
      },
    };
  }

  if (error instanceof ZodError) {
    return {
      success: false,
      error: {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        statusCode: 400,
        details: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        })),
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Default error response for unexpected errors
  return {
    success: false,
    error: {
      message: isDevelopment ? error.message : "Internal server error",
      code: "INTERNAL_ERROR",
      statusCode: 500,
      timestamp: new Date().toISOString(),
      ...(isDevelopment && {
        stack: error.stack,
        originalError: error.name,
      }),
    },
  };
}

// Global error handling middleware
export function globalErrorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const errorResponse = formatErrorResponse(error, req);
  const statusCode = errorResponse.error.statusCode || 500;

  // Set security headers even for error responses
  res.setHeader("X-Content-Type-Options", "nosniff");

  res.status(statusCode).json(errorResponse);
}

// Async error wrapper for route handlers
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 404 handler for unmatched routes
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
}

// Process error handlers for uncaught exceptions
export function setupProcessErrorHandlers() {
  process.on("uncaughtException", (error: Error) => {
    console.error("Uncaught Exception:", error);
    const logger = ErrorLogger.getInstance();
    logger.log(error, undefined, { type: "uncaughtException" });

    // In production, you might want to gracefully shutdown
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  });

  process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    const logger = ErrorLogger.getInstance();
    logger.log(new Error(String(reason)), undefined, {
      type: "unhandledRejection",
      promise: promise.toString(),
    });
  });
}
