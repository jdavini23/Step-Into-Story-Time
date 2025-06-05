import { useCallback, useState } from "react";
import { toast } from "@/hooks/use-toast";

interface ErrorDetails {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
}

interface UseErrorHandlerReturn {
  handleError: (error: Error | ErrorDetails | any) => void;
  clearError: () => void;
  error: ErrorDetails | null;
  isError: boolean;
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setError] = useState<ErrorDetails | null>(null);

  const categorizeError = useCallback((error: any): ErrorDetails => {
    // Handle API error responses
    if (error.response?.data?.error) {
      return {
        message: error.response.data.error.message,
        code: error.response.data.error.code,
        statusCode: error.response.status,
        details: error.response.data.error.details,
      };
    }

    // Handle fetch errors
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      return {
        message: "Network error. Please check your connection.",
        code: "NETWORK_ERROR",
        statusCode: 0,
      };
    }

    // Handle authentication errors
    if (error.message?.includes("401") || error.statusCode === 401) {
      return {
        message: "Please sign in to continue.",
        code: "AUTHENTICATION_ERROR",
        statusCode: 401,
      };
    }

    // Handle authorization errors
    if (error.message?.includes("403") || error.statusCode === 403) {
      return {
        message: "You do not have permission to perform this action.",
        code: "AUTHORIZATION_ERROR",
        statusCode: 403,
      };
    }

    // Handle validation errors
    if (error.message?.includes("validation") || error.statusCode === 400) {
      return {
        message: error.details
          ? "Please check your input."
          : error.message || "Invalid input.",
        code: "VALIDATION_ERROR",
        statusCode: 400,
        details: error.details,
      };
    }

    // Handle rate limiting
    if (error.message?.includes("rate limit") || error.statusCode === 429) {
      return {
        message: "Too many requests. Please wait a moment and try again.",
        code: "RATE_LIMIT_ERROR",
        statusCode: 429,
      };
    }

    // Handle server errors
    if (error.statusCode >= 500) {
      return {
        message: "Server error. Please try again later.",
        code: "SERVER_ERROR",
        statusCode: error.statusCode,
      };
    }

    // Default error handling
    return {
      message: error.message || "An unexpected error occurred.",
      code: "UNKNOWN_ERROR",
      statusCode: error.statusCode || 500,
    };
  }, []);

  const handleError = useCallback(
    (error: Error | ErrorDetails | any) => {
      const errorDetails = categorizeError(error);
      setError(errorDetails);

      // Show appropriate toast based on error type
      const getToastVariant = (code?: string) => {
        switch (code) {
          case "VALIDATION_ERROR":
            return "default";
          case "AUTHENTICATION_ERROR":
          case "AUTHORIZATION_ERROR":
            return "destructive";
          case "RATE_LIMIT_ERROR":
            return "default";
          case "NETWORK_ERROR":
            return "destructive";
          default:
            return "destructive";
        }
      };

      // Don't show toast for certain error types that should be handled differently
      const shouldShowToast = !["AUTHENTICATION_ERROR"].includes(
        errorDetails.code || "",
      );

      if (shouldShowToast) {
        toast({
          title: getErrorTitle(errorDetails.code),
          description: errorDetails.message,
          variant: getToastVariant(errorDetails.code),
          duration: getToastDuration(errorDetails.code),
        });
      }

      // Handle specific error types
      if (errorDetails.code === "AUTHENTICATION_ERROR") {
        // Redirect to login
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1000);
      }

      // Log error for debugging
      console.error("Error handled:", errorDetails);
    },
    [categorizeError],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    handleError,
    clearError,
    error,
    isError: error !== null,
  };
}

function getErrorTitle(code?: string): string {
  switch (code) {
    case "NETWORK_ERROR":
      return "Connection Error";
    case "AUTHENTICATION_ERROR":
      return "Authentication Required";
    case "AUTHORIZATION_ERROR":
      return "Access Denied";
    case "VALIDATION_ERROR":
      return "Input Error";
    case "RATE_LIMIT_ERROR":
      return "Too Many Requests";
    case "SERVER_ERROR":
      return "Server Error";
    default:
      return "Error";
  }
}

function getToastDuration(code?: string): number {
  switch (code) {
    case "VALIDATION_ERROR":
      return 5000;
    case "RATE_LIMIT_ERROR":
      return 7000;
    case "NETWORK_ERROR":
    case "SERVER_ERROR":
      return 10000;
    default:
      return 5000;
  }
}
