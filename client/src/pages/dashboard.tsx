import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect, useState } from "react";
import { Plus, BookOpen, Heart, HeartOff } from "lucide-react";
import type { Story } from "@shared/schema";

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

  const [showFavorites, setShowFavorites] = useState(false);
  const queryClient = useQueryClient();

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ storyId, isFavorited }: { storyId: number; isFavorited: boolean }) => {
      const method = isFavorited ? 'DELETE' : 'POST';
      const response = await fetch(`/api/favorites/${storyId}`, {
        method,
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to toggle favorite');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: "Success",
        description: "Favorite updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update favorite",
        variant: "destructive",
      });
    },
  });

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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl">📚</span>
          </div>
          <p className="text-gray-600">Loading your story library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Dashboard header */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-700 mb-2">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}! ✨
          </h2>
          <p className="text-sm sm:text-base text-gray-600">Ready to create another magical bedtime adventure?</p>
        </div>
        
        {/* Quick actions */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6 sm:mb-8">
          <Link href="/story-wizard">
            <Card className="bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-500 text-white p-6 hover:scale-105 transition-transform cursor-pointer">
              <CardContent className="p-0">
                <div className="text-3xl mb-2">✨</div>
                <h3 className="font-semibold text-lg mb-1">Create New Story</h3>
                <p className="text-white/80 text-sm">Start a magical adventure</p>
              </CardContent>
            </Card>
          </Link>
          
          <Card className="p-6 shadow-lg">
            <CardContent className="p-0">
              <div className="text-3xl mb-2">📚</div>
              <h3 className="font-semibold text-lg mb-1 text-gray-700">
                {stories.length} {stories.length === 1 ? 'Story' : 'Stories'}
              </h3>
              <p className="text-gray-600 text-sm">Total created</p>
            </CardContent>
          </Card>
          
          <Card 
            className="p-6 shadow-lg cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setShowFavorites(!showFavorites)}
          >
            <CardContent className="p-0">
              <div className="text-3xl mb-2">💝</div>
              <h3 className="font-semibold text-lg mb-1 text-gray-700">
                {favoriteStories.length} Favorites
              </h3>
              <p className="text-gray-600 text-sm">Your beloved stories</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Filter toggle */}
        {stories.length > 0 && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button
                variant={!showFavorites ? "default" : "outline"}
                onClick={() => setShowFavorites(false)}
                className="transition-all"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                All Stories ({stories.length})
              </Button>
              <Button
                variant={showFavorites ? "default" : "outline"}
                onClick={() => setShowFavorites(true)}
                className="transition-all"
              >
                <Heart className="w-4 h-4 mr-2" />
                Favorites ({favoriteStories.length})
              </Button>
            </div>
          </div>
        )}
        
        {/* Story grid */}
        {(showFavorites ? favoriteStories : stories).length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(showFavorites ? favoriteStories : stories).map((story) => {
              const isFavorited = favoriteStories.some(fav => fav.id === story.id);
              return (
                <Card key={story.id} className="shadow-lg hover:scale-105 transition-transform overflow-hidden group">
                  <div className="relative">
                    <Link href={`/story/${story.id}`}>
                      <div className="h-48 bg-gradient-to-br from-purple-100 via-blue-100 to-yellow-100 flex items-center justify-center cursor-pointer">
                        <div className="text-center">
                          <span className="text-4xl mb-2 block">
                            {story.tone === 'adventurous' && '🗺️'}
                            {story.tone === 'silly' && '😄'}
                            {story.tone === 'calming' && '🌙'}
                            {story.tone === 'educational' && '📚'}
                          </span>
                          <p className="text-sm text-gray-600 capitalize">{story.tone} Adventure</p>
                        </div>
                      </div>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 p-2 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavoriteMutation.mutate({ storyId: story.id, isFavorited });
                      }}
                      disabled={toggleFavoriteMutation.isPending}
                    >
                      {isFavorited ? (
                        <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                      ) : (
                        <HeartOff className="w-4 h-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                  <Link href={`/story/${story.id}`}>
                    <CardContent className="p-6 cursor-pointer">
                      <h3 className="font-semibold text-lg text-gray-700 mb-2 line-clamp-1">
                        {story.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        A {story.tone} story featuring {story.childName}
                        {story.favoriteThemes && ` with ${story.favoriteThemes}`}...
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{new Date(story.createdAt || '').toLocaleDateString()}</span>
                        <span>{story.length === 'short' ? '2-3' : '4-5'} min read</span>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Empty state */
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">{showFavorites ? '💝' : '📚'}</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">
              {showFavorites ? "No favorite stories yet!" : "Your story library is waiting!"}
            </h3>
            <p className="text-gray-600 mb-6">
              {showFavorites 
                ? "Start favoriting stories by clicking the heart icon on any story."
                : "Create your first magical bedtime story and start building memories."
              }
            </p>
            {!showFavorites && (
              <Link href="/story-wizard">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-semibold text-lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Story
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
      
      {/* Floating action button for mobile */}
      <Link href="/story-wizard">
        <Button className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-500 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform md:hidden z-50">
          <Plus className="w-6 h-6" />
        </Button>
      </Link>
    </div>
  );
}
