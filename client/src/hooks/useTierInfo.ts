import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export interface TierInfo {
  tier: "free" | "premium" | "family";
  status: string;
  canGenerate: boolean;
  reason?: string;
  storiesRemaining?: number;
  weeklyUsage: number;
  weekStart: string;
  limits: {
    storiesPerWeek: number | null;
    maxStoriesInLibrary: number | null;
    canDownloadPdf: boolean;
    canAccessAllThemes: boolean;
    canAccessAllLengths: boolean;
    maxChildProfiles: number;
    hasAiIllustrations: boolean;
    hasAudioNarration: boolean;
    hasMagicLetters: boolean;
    hasCustomCharacters: boolean;
  };
}

export function useTierInfo() {
  return useQuery({
    queryKey: ["/api/user/tier-info"],
    queryFn: getQueryFn<TierInfo>({ on401: "returnNull" }),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}
