import { QueryClient, QueryFunction } from "@tanstack/react-query";

const API_BASE_URL = import.meta.env.DEV ? "" : "";

// CSRF token management
let csrfToken: string | null = null;
let csrfTokenPromise: Promise<string> | null = null;

async function getCSRFToken(): Promise<string> {
  // If we already have a token, return it
  if (csrfToken) return csrfToken;

  // If we're already fetching a token, wait for that request
  if (csrfTokenPromise) return csrfTokenPromise;

  // Start a new request
  csrfTokenPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/csrf-token`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      csrfToken = data.csrfToken;
      return csrfToken;
    } catch (error) {
      console.error('Failed to get CSRF token:', error);
      throw new Error('Failed to get CSRF token');
    } finally {
      csrfTokenPromise = null;
    }
  })();

  return csrfTokenPromise;
}

// Function to clear cached token (useful for logout or token expiry)
export function clearCSRFToken() {
  csrfToken = null;
  csrfTokenPromise = null;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const needsCSRF = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());

  const makeRequest = async (retryOnCSRFFailure = true): Promise<Response> => {
    const headers: Record<string, string> = {};

    if (data) {
      headers["Content-Type"] = "application/json";
    }

    if (needsCSRF) {
      try {
        const token = await getCSRFToken();
        headers['X-CSRF-Token'] = token;
      } catch (error) {
        console.error('Failed to get CSRF token:', error);
        // For now, continue without CSRF token to avoid blocking all requests
        console.warn('Proceeding without CSRF token due to error');
      }
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: method.toUpperCase(),
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include'
    });

    // If we get a CSRF error and we can retry, clear token and try again
    if (response.status === 403 && retryOnCSRFFailure) {
      try {
        const errorData = await response.json();
        if (errorData.code && (errorData.code.includes('CSRF') || errorData.code === 'CSRF_SESSION_REFRESH_REQUIRED')) {
          console.log('CSRF error detected, clearing token and retrying...');
          clearCSRFToken();
          return makeRequest(false); // Retry once without further retries
        }
      } catch (parseError) {
        // If we can't parse the error response, still try to retry once
        if (retryOnCSRFFailure) {
          clearCSRFToken();
          return makeRequest(false);
        }
      }
    }

    return response;
  };

  return makeRequest();
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}
type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Configure the query client with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 401/403 errors
        if (error && typeof error === "object" && "status" in error) {
          const status = (error as any).status;
          if (status === 401 || status === 403) {
            return false;
          }
        }
        return failureCount < 3;
      },
      staleTime: 30000, // 30 seconds
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
  },
});