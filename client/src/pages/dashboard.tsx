import { useAuth } from "@/hooks/useAuth";
import { useTierInfo } from "@/hooks/useTierInfo";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect, useState } from "react";
import type { Story } from "@shared/schema";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { QuickActionsGrid } from "@/components/dashboard/quick-actions-grid";
import { StoryFilterButtons } from "@/components/dashboard/story-filter-buttons";
import { StoryCard } from "@/components/dashboard/story-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { FloatingActionButton } from "@/components/dashboard/floating-action-button";
import LoadingOverlay from "@/components/loading-overlay";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar, Crown, TrendingUp, Sparkles, X } from "lucide-react";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const { data: tierInfo } = useTierInfo();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: stories = [], isLoading: storiesLoading, error } = useQuery<Story[]>({
    queryKey: ["/api/stories"],
    enabled: !!user,
  });

  const { data: favoriteStories = [] } = useQuery<Story[]>({
    queryKey: ["/api/favorites"],
    enabled: !!user,
  });

  const { data: subscriptionStatus } = useQuery<{ hasActiveSubscription: boolean; status?: string }>({
    queryKey: ["/api/subscription-status"],
    enabled: !!user,
  });

  const [showFavorites, setShowFavorites] = useState(false);
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);

  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [user, isLoading, toast]);

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  if (isLoading || storiesLoading) {
    return <LoadingOverlay isLoading={true} message="Loading your story library..." />;
  }

  const displayedStories = showFavorites ? favoriteStories : stories;

  // Consolidated notification logic
  const getActiveNotification = () => {
    if (!tierInfo) return null;

    const weeklyUsage = tierInfo.usage.storiesThisWeek;
    const maxStories = tierInfo.limits.maxStoriesPerWeek;
    const isAtWeeklyLimit = weeklyUsage >= maxStories;
    const isNearWeeklyLimit = weeklyUsage >= maxStories * 0.8;

    const currentStoryCount = stories.length;
    const maxStorageStories = tierInfo.limits.maxStoredStories;
    const isAtStorageLimit = currentStoryCount >= maxStorageStories;
    const isNearStorageLimit = currentStoryCount >= maxStorageStories * 0.9;

    const hasActiveSubscription = subscriptionStatus?.hasActiveSubscription;

    // Priority order: Critical alerts first, then warnings, then promotional
    if (isAtStorageLimit && !dismissedNotifications.includes('storage-limit')) {
      return {
        id: 'storage-limit',
        type: 'critical' as const,
        title: 'Story Library Full',
        message: `You've reached your limit of ${maxStorageStories} stories. To create new stories, you'll need to delete older ones or upgrade to Premium.`,
        action: { text: 'Upgrade', onClick: () => setLocation("/pricing") },
        progress: { current: currentStoryCount, max: maxStorageStories }
      };
    }

    if (isAtWeeklyLimit && !dismissedNotifications.includes('weekly-limit')) {
      return {
        id: 'weekly-limit',
        type: 'critical' as const,
        title: 'Weekly Story Limit Reached',
        message: `You've used all ${maxStories} stories this week. Premium users get unlimited stories.`,
        action: { text: 'Upgrade', onClick: () => setLocation("/pricing") },
        progress: { current: weeklyUsage, max: maxStories }
      };
    }

    if (isNearStorageLimit && !dismissedNotifications.includes('storage-warning')) {
      return {
        id: 'storage-warning',
        type: 'warning' as const,
        title: 'Library Almost Full',
        message: `You have ${currentStoryCount} of ${maxStorageStories} stories. Premium users get unlimited story storage.`,
        action: { text: 'Upgrade', onClick: () => setLocation("/pricing") },
        progress: { current: currentStoryCount, max: maxStorageStories }
      };
    }

    if (isNearWeeklyLimit && !dismissedNotifications.includes('weekly-warning')) {
      return {
        id: 'weekly-warning',
        type: 'warning' as const,
        title: 'Weekly Usage High',
        message: `You've used ${weeklyUsage} of ${maxStories} stories this week. Premium users get unlimited stories.`,
        action: { text: 'Upgrade', onClick: () => setLocation("/pricing") },
        progress: { current: weeklyUsage, max: maxStories }
      };
    }

    if (!hasActiveSubscription && tierInfo.tier === 'free' && !dismissedNotifications.includes('premium-offer')) {
      return {
        id: 'premium-offer',
        type: 'info' as const,
        title: 'Unlock Premium Features',
        message: 'Get unlimited stories, PDF downloads, and priority support with Premium.',
        action: { text: 'Learn More', onClick: () => setLocation("/pricing") }
      };
    }

    return null;
  };

  const activeNotification = getActiveNotification();

  const dismissNotification = (id: string) => {
    setDismissedNotifications(prev => [...prev, id]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <DashboardHeader user={user as any} />

        {activeNotification && (
          <Card className={`mb-6 ${
            activeNotification.type === 'critical' ? 'border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800' :
            activeNotification.type === 'warning' ? 'border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800' :
            'border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex-shrink-0">
                    {activeNotification.type === 'critical' && <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />}
                    {activeNotification.type === 'warning' && <Calendar className="h-6 w-6 text-amber-600 dark:text-amber-400" />}
                    {activeNotification.type === 'info' && <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${
                      activeNotification.type === 'critical' ? 'text-red-800 dark:text-red-200' :
                      activeNotification.type === 'warning' ? 'text-amber-800 dark:text-amber-200' :
                      'text-blue-800 dark:text-blue-200'
                    }`}>
                      {activeNotification.title}
                    </h3>
                    <p className={`text-sm mt-1 ${
                      activeNotification.type === 'critical' ? 'text-red-700 dark:text-red-300' :
                      activeNotification.type === 'warning' ? 'text-amber-700 dark:text-amber-300' :
                      'text-blue-700 dark:text-blue-300'
                    }`}>
                      {activeNotification.message}
                    </p>
                    
                    {activeNotification.progress && (
                      <div className="flex items-center space-x-2 mt-3">
                        <div className={`w-32 rounded-full h-2 ${
                          activeNotification.type === 'critical' ? 'bg-red-200 dark:bg-red-800' :
                          activeNotification.type === 'warning' ? 'bg-amber-200 dark:bg-amber-800' :
                          'bg-blue-200 dark:bg-blue-800'
                        }`}>
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              activeNotification.type === 'critical' ? 'bg-red-600 dark:bg-red-400' :
                              activeNotification.type === 'warning' ? 'bg-amber-600 dark:bg-amber-400' :
                              'bg-blue-600 dark:bg-blue-400'
                            }`}
                            style={{ width: `${Math.min((activeNotification.progress.current / activeNotification.progress.max) * 100, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${
                          activeNotification.type === 'critical' ? 'text-red-600 dark:text-red-400' :
                          activeNotification.type === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                          'text-blue-600 dark:text-blue-400'
                        }`}>
                          {activeNotification.progress.current}/{activeNotification.progress.max}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {activeNotification.type === 'info' ? 'Ready to upgrade?' : 'Need more capacity?'}
                        </span>
                      </div>
                      <Button
                        onClick={activeNotification.action.onClick}
                        size="sm"
                        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90"
                      >
                        <Crown className="w-4 h-4 mr-1" />
                        {activeNotification.action.text}
                      </Button>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissNotification(activeNotification.id)}
                  className="ml-2 h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="h-4 w-4" />
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

        <StoryFilterButtons 
          stories={stories}
          favoriteStories={favoriteStories}
          showFavorites={showFavorites}
          onShowFavorites={setShowFavorites}
        />

        {displayedStories.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedStories.map((story) => {
              const isFavorited = favoriteStories.some(fav => fav.id === story.id);
              return (
                <StoryCard 
                  key={story.id}
                  story={story}
                  isFavorited={isFavorited}
                />
              );
            })}
          </div>
        ) : (
          <EmptyState showFavorites={showFavorites} />
        )}
      </div>

      <FloatingActionButton />
    </div>
  );
}