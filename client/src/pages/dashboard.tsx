import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect, useState } from "react";
import type { Story } from "@shared/schema";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { PremiumStatusCard } from "@/components/dashboard/premium-status-card";
import { QuickActionsGrid } from "@/components/dashboard/quick-actions-grid";
import { StoryFilterButtons } from "@/components/dashboard/story-filter-buttons";
import { StoryCard } from "@/components/dashboard/story-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { FloatingActionButton } from "@/components/dashboard/floating-action-button";
import LoadingOverlay from "@/components/loading-overlay";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
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

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <DashboardHeader user={user} />

        <PremiumStatusCard subscriptionStatus={subscriptionStatus} />

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