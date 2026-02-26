import { useAuth } from "@/hooks/useAuth";
import { useTierInfo } from "@/hooks/useTierInfo";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";
import { getQueryFn } from "@/lib/queryClient";
import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import type { Story } from "@shared/schema";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { QuickActionsGrid } from "@/components/dashboard/quick-actions-grid";
import { StoryFilterButtons } from "@/components/dashboard/story-filter-buttons";
import { StoryCard } from "@/components/dashboard/story-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { FloatingActionButton } from "@/components/dashboard/floating-action-button";
import { PremiumFeatureShowcase } from "@/components/dashboard/premium-feature-showcase";
import LoadingOverlay from "@/components/loading-overlay";
const DebugPanel = lazy(() => import("@/components/debug-panel").then(m => ({ default: m.DebugPanel })));
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar, Sparkles, X, Crown } from "lucide-react";
import {
  SkeletonCard,
  SkeletonQuickActions,
} from "@/components/ui/skeleton-card";
import { EnhancedErrorState } from "@/components/enhanced-error-state";
import { useEnhancedToast } from "@/components/enhanced-toast-system";
import { FocusManagement } from "@/components/accessibility-enhancements";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const { data: tierInfo } = useTierInfo();
  const [, setLocation] = useLocation();
  const { showActionToast, toast } = useEnhancedToast();

  const {
    data: stories = [],
    isLoading: storiesLoading,
    error,
    refetch: refetchStories,
  } = useQuery<Story[]>({
    queryKey: ["/api/stories"],
    queryFn: getQueryFn<Story[]>({ on401: "throw" }),
    enabled: !!user,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  const { data: favoriteStories = [], refetch: refetchFavorites } = useQuery<
    Story[]
  >({
    queryKey: ["/api/favorites"],
    queryFn: getQueryFn<Story[]>({ on401: "throw" }),
    enabled: !!user,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  const { data: subscriptionStatus } = useQuery<{
    hasActiveSubscription: boolean;
    status?: string;
  }>({
    queryKey: ["/api/subscription-status"],
    queryFn: getQueryFn<{ hasActiveSubscription: boolean; status?: string }>({
      on401: "throw",
    }),
    enabled: !!user,
  });

  const [showFavorites, setShowFavorites] = useState(false);
  const { dismissedNotifications, dismissNotification, isDismissed } =
    useNotificationPreferences();

  // Handle unauthorized user redirect
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Session Required",
        description: "Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isLoading, user, toast]);

  // Handle API auth errors
  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Session Expired",
        description: "Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  const displayedStories = showFavorites ? favoriteStories : stories;

  // Single consolidated notification system
  const activeNotification = useMemo(() => {
    if (!tierInfo) return null;

    const currentStoryCount = stories.length;
    const maxStorageStories = tierInfo.limits.maxStoriesInLibrary;
    const weeklyUsage = tierInfo.weeklyUsage;
    const maxWeeklyStories = tierInfo.limits.storiesPerWeek;
    const hasActiveSubscription = subscriptionStatus?.hasActiveSubscription;

    // Storage limits (highest priority) - skip for unlimited storage
    const isAtStorageLimit =
      maxStorageStories !== null && currentStoryCount >= maxStorageStories;
    const isNearStorageLimit =
      maxStorageStories !== null &&
      currentStoryCount >= maxStorageStories * 0.9;

    // Weekly limits - skip for unlimited weekly stories
    const isAtWeeklyLimit =
      maxWeeklyStories !== null && weeklyUsage >= maxWeeklyStories;
    const isNearWeeklyLimit =
      maxWeeklyStories !== null && weeklyUsage >= maxWeeklyStories * 0.8;

    // Priority: Critical storage > Critical weekly > Warning storage > Warning weekly > Promotional
    if (isAtStorageLimit && !isDismissed("storage-limit")) {
      return {
        id: "storage-limit",
        type: "critical" as const,
        title: "Story Library Full",
        message: `You've reached your limit of ${maxStorageStories} stories. Delete older stories or upgrade to Premium.`,
        actionText: "Upgrade Now",
        actionHref: "/pricing",
        progress: { current: currentStoryCount, max: maxStorageStories },
      };
    }

    if (isAtWeeklyLimit && !isDismissed("weekly-limit")) {
      return {
        id: "weekly-limit",
        type: "critical" as const,
        title: "Weekly Story Limit Reached",
        message: `You've created ${maxWeeklyStories} stories this week. Premium users get unlimited stories.`,
        actionText: "Upgrade Now",
        actionHref: "/pricing",
        progress: { current: weeklyUsage, max: maxWeeklyStories },
      };
    }

    if (isNearStorageLimit && !isDismissed("storage-warning")) {
      return {
        id: "storage-warning",
        type: "warning" as const,
        title: "Library Almost Full",
        message: `${currentStoryCount} of ${maxStorageStories} stories used. Premium users get unlimited storage.`,
        actionText: "Upgrade",
        actionHref: "/pricing",
        progress: { current: currentStoryCount, max: maxStorageStories },
      };
    }

    if (isNearWeeklyLimit && !isDismissed("weekly-warning")) {
      return {
        id: "weekly-warning",
        type: "warning" as const,
        title: "Weekly Usage High",
        message: `${weeklyUsage} of ${maxWeeklyStories} weekly stories used. Premium users get unlimited stories.`,
        actionText: "Upgrade",
        actionHref: "/pricing",
        progress: { current: weeklyUsage, max: maxWeeklyStories },
      };
    }

    if (
      !hasActiveSubscription &&
      tierInfo.tier === "free" &&
      !isDismissed("premium-offer")
    ) {
      return {
        id: "premium-offer",
        type: "info" as const,
        title: "Unlock Premium Features",
        message: "Get unlimited stories, PDF downloads, and priority support.",
        actionText: "View Plans",
        actionHref: "/pricing",
      };
    }

    return null;
  }, [stories.length, tierInfo, subscriptionStatus?.hasActiveSubscription, isDismissed, dismissedNotifications]);

  if (isLoading) {
    return (
      <LoadingOverlay
        isLoading={true}
        message="Loading your story library..."
      />
    );
  }

  if (storiesLoading) {
    return (
      <div className="min-h-screen bg-story-cream py-6 sm:py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <DashboardHeader user={user as any} />

          {/* Skeleton for quick actions */}
          <SkeletonQuickActions />

          {/* Skeleton for filter buttons */}
          <div className="flex space-x-2 mb-6">
            <div className="h-9 w-24 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="h-9 w-32 bg-gray-200 rounded-md animate-pulse"></div>
          </div>

          {/* Skeleton for story grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-story-cream dark:bg-gray-900 py-6 sm:py-8 lg:py-12">
      <FocusManagement />
      <div id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <DashboardHeader user={user as any} />

        {activeNotification && (
          <Card
            className={`mb-6 ${
              activeNotification.type === "critical"
                ? "border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800"
                : activeNotification.type === "warning"
                  ? "border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800"
                  : "border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800"
            }`}
          >
            <CardContent className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="flex-shrink-0">
                    {activeNotification.type === "critical" && (
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    )}
                    {activeNotification.type === "warning" && (
                      <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    )}
                    {activeNotification.type === "info" && (
                      <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4
                          className={`font-semibold text-sm ${
                            activeNotification.type === "critical"
                              ? "text-red-800 dark:text-red-200"
                              : activeNotification.type === "warning"
                                ? "text-amber-800 dark:text-amber-200"
                                : "text-blue-800 dark:text-blue-200"
                          }`}
                        >
                          {activeNotification.title}
                        </h4>
                        <p
                          className={`text-xs mt-0.5 ${
                            activeNotification.type === "critical"
                              ? "text-red-700 dark:text-red-300"
                              : activeNotification.type === "warning"
                                ? "text-amber-700 dark:text-amber-300"
                                : "text-blue-700 dark:text-blue-300"
                          }`}
                        >
                          {activeNotification.message}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {activeNotification.progress && (
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-16 rounded-full h-1.5 ${
                                activeNotification.type === "critical"
                                  ? "bg-red-200 dark:bg-red-800"
                                  : activeNotification.type === "warning"
                                    ? "bg-amber-200 dark:bg-amber-800"
                                    : "bg-blue-200 dark:bg-blue-800"
                              }`}
                            >
                              <div
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  activeNotification.type === "critical"
                                    ? "bg-red-600 dark:bg-red-400"
                                    : activeNotification.type === "warning"
                                      ? "bg-amber-600 dark:bg-amber-400"
                                      : "bg-blue-600 dark:bg-blue-400"
                                }`}
                                style={{
                                  width: `${Math.min((activeNotification.progress.current / activeNotification.progress.max) * 100, 100)}%`,
                                }}
                              />
                            </div>
                            <span
                              className={`text-xs font-medium ${
                                activeNotification.type === "critical"
                                  ? "text-red-600 dark:text-red-400"
                                  : activeNotification.type === "warning"
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-blue-600 dark:text-blue-400"
                              }`}
                            >
                              {activeNotification.progress.current}/
                              {activeNotification.progress.max}
                            </span>
                          </div>
                        )}
                        <Button
                          onClick={() => setLocation(activeNotification.actionHref)}
                          size="sm"
                          className="bg-story-gold text-story-night hover:bg-story-sunset text-xs px-3 py-1 h-7"
                        >
                          <Crown className="w-3 h-3 mr-1" />
                          {activeNotification.actionText}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissNotification(activeNotification.id)}
                  className="ml-2 h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <QuickActionsGrid
          stories={stories}
          favoriteStories={favoriteStories}
          showFavorites={showFavorites}
          onToggleFavorites={() => setShowFavorites(!showFavorites)}
        />

        {tierInfo && <PremiumFeatureShowcase tierInfo={tierInfo} />}

        <div className="flex items-center justify-between mb-6">
          <StoryFilterButtons
            stories={stories}
            favoriteStories={favoriteStories}
            showFavorites={showFavorites}
            onShowFavorites={setShowFavorites}
          />

          {import.meta.env.DEV && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchStories();
                refetchFavorites();
                showActionToast.dataRefreshed();
              }}
            >
              Refresh Stories
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-6">
            <EnhancedErrorState
              error={error as Error}
              onRetry={() => {
                refetchStories();
                refetchFavorites();
                showActionToast.dataRefreshed();
              }}
              title="Error Loading Stories"
              description="There was a problem loading your stories. Please try again."
            />
          </div>
        )}

        {!error && displayedStories.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedStories.map((story) => {
              const isFavorited = favoriteStories.some(
                (fav) => fav.id === story.id,
              );
              return (
                <StoryCard
                  key={story.id}
                  story={story}
                  isFavorited={isFavorited}
                />
              );
            })}
          </div>
        ) : !error && !storiesLoading ? (
          <EmptyState showFavorites={showFavorites} />
        ) : null}
      </div>

      <FloatingActionButton />

      {/* Debug Panel - only show in development */}
      {import.meta.env.DEV && (
        <Suspense fallback={null}>
          <DebugPanel />
        </Suspense>
      )}
    </div>
  );
}
