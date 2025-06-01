
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, HeartOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Story } from "@shared/schema";

interface StoryCardProps {
  story: Story;
  isFavorited: boolean;
}

export function StoryCard({ story, isFavorited }: StoryCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ storyId, isFavorited }: { storyId: number; isFavorited: boolean }) => {
      const method = isFavorited ? 'DELETE' : 'POST';
      const response = await fetch(`/api/favorites/${storyId}`, {
        method,
        credentials: 'include',
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to toggle favorite: ${errorText}`);
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
    onError: (error) => {
      console.error("Favorite toggle error:", error);
      toast({
        title: "Error",
        description: "Failed to update favorite",
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="shadow-lg hover:scale-105 transition-transform overflow-hidden group">
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
}
