import { QueryClient, QueryFunction } from "@tanstack/react-query";

const API_BASE_URL = import.meta.env.DEV ? "" : "";

// CSRF token management
let csrfToken: string | null = null;

async function getCSRFToken(): Promise<string> {
  if (csrfToken) return csrfToken;

  try {
    const response = await fetch(`${API_BASE_URL}/api/csrf-token`, {
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      csrfToken = data.csrfToken;
      return csrfToken;
    }
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
  }

  throw new Error('Failed to get CSRF token');
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Add CSRF token for state-changing requests
  const needsCSRF = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (needsCSRF) {
    try {
      const token = await getCSRFToken();
      headers['X-CSRF-Token'] = token;
    } catch (error) {
      console.error('Failed to add CSRF token:', error);
      // Continue without CSRF token, server will reject if required
    }
  }
  const res = await fetch(url, {
    method,
    headers: data ? headers : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
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