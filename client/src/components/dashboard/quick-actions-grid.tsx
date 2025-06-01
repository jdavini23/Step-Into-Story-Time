
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import type { Story } from "@shared/schema";

interface QuickActionsGridProps {
  stories: Story[];
  favoriteStories: Story[];
  showFavorites: boolean;
  onToggleFavorites: () => void;
}

export function QuickActionsGrid({ 
  stories, 
  favoriteStories, 
  showFavorites, 
  onToggleFavorites 
}: QuickActionsGridProps) {
  return (
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
        onClick={onToggleFavorites}
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
  );
}
