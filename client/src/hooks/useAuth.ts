import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error, isError } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: false,
  });

  // If we get a 401 error or any error, consider user not authenticated
  // isLoading should only be true during the initial request
  const isAuthenticated = !!user && !isError;
  const authLoading = isLoading && !isError;

  return {
    user,
    isLoading: authLoading,
    isAuthenticated,
  };
}
