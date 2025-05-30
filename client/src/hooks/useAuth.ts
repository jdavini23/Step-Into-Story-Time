import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading, error, isError } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Only fetch once per app load
    staleTime: Infinity, // Never consider stale
    refetchInterval: false,
    refetchOnReconnect: false,
  });

  // User is authenticated if we have user data and no error
  const isAuthenticated = !!user && !isError;
  
  // Only show loading on the very first request
  const authLoading = isLoading;

  return {
    user,
    isLoading: authLoading,
    isAuthenticated,
  };
}
