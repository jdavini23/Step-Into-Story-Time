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
      if (!csrfToken) {
        throw new Error('No CSRF token in response');
      }
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
        console.error('Failed to add CSRF token:', error);
        throw new Error('CSRF token required but unavailable');
      }
    }

    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    // If we get a 403 CSRF error and haven't retried yet, clear token and retry
    if (res.status === 403 && needsCSRF && retryOnCSRFFailure) {
      try {
        const responseText = await res.clone().text();
        if (responseText.includes('CSRF') || responseText.includes('csrf')) {
          console.warn('CSRF token invalid, clearing cache and retrying...');
          clearCSRFToken();
          return makeRequest(false); // Retry without further retries
        }
      } catch (textError) {
        console.warn('Failed to read response text for CSRF check:', textError);
      }
    }

    await throwIfResNotOk(res);
    return res;
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