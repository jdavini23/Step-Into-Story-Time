
import { Button } from "@/components/ui/button";
import { BookOpen, Heart } from "lucide-react";
import type { Story } from "@shared/schema";

interface StoryFilterButtonsProps {
  stories: Story[];
  favoriteStories: Story[];
  showFavorites: boolean;
  onShowFavorites: (show: boolean) => void;
}

export function StoryFilterButtons({ 
  stories, 
  favoriteStories, 
  showFavorites, 
  onShowFavorites 
}: StoryFilterButtonsProps) {
  if (stories.length === 0) return null;

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <Button
          variant={!showFavorites ? "default" : "outline"}
          onClick={() => onShowFavorites(false)}
          className="transition-all"
        >
          <BookOpen className="w-4 h-4 mr-2" />
          All Stories ({stories.length})
        </Button>
        <Button
          variant={showFavorites ? "default" : "outline"}
          onClick={() => onShowFavorites(true)}
          className="transition-all"
        >
          <Heart className="w-4 h-4 mr-2" />
          Favorites ({favoriteStories.length})
        </Button>
      </div>
    </div>
  );
}
