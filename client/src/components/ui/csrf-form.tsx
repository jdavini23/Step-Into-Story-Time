import React, { FormEvent, ReactNode } from "react";
import { useCSRF } from "@/hooks/useCSRF";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

interface CSRFFormProps {
  onSubmit: (
    event: FormEvent<HTMLFormElement>,
    csrfToken: string,
  ) => void | Promise<void>;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function CSRFForm({
  onSubmit,
  children,
  className,
  disabled,
}: CSRFFormProps) {
  const { token, loading, error, refreshToken } = useCSRF();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      console.error("No CSRF token available");
      return;
    }

    try {
      await onSubmit(event, token);
    } catch (error) {
      // If submission fails due to CSRF, refresh token
      if (error instanceof Error && error.message.includes("CSRF")) {
        refreshToken();
      }
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm text-gray-600">Loading security token...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Security token error: {error}
          <button
            onClick={refreshToken}
            className="ml-2 underline hover:no-underline"
          >
            Try again
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      {/* Hidden CSRF token input for fallback */}
      <input type="hidden" name="_csrf" value={token || ""} />
      <fieldset disabled={disabled || !token}>{children}</fieldset>
    </form>
  );
}
