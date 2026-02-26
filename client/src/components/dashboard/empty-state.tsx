import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface EmptyStateProps {
  showFavorites: boolean;
}

export function EmptyState({ showFavorites }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="w-24 h-24 bg-gradient-to-r from-story-gold via-story-sunset to-story-forest rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-4xl">{showFavorites ? "💝" : "📚"}</span>
      </div>
      <h3 className="text-2xl font-serif font-bold text-story-bark mb-2">
        {showFavorites
          ? "No favorite stories yet!"
          : "Your story library is waiting!"}
      </h3>
      <p className="text-story-bark/70 mb-6">
        {showFavorites
          ? "Start favoriting stories by clicking the heart icon on any story."
          : "Create your first magical bedtime story and start building memories."}
      </p>
      {!showFavorites && (
        <Link href="/story-wizard">
          <Button className="bg-story-gold hover:bg-story-sunset text-white px-8 py-3 rounded-xl font-semibold text-lg">
            <Plus className="w-5 h-5 mr-2" />
            Create Your First Story
          </Button>
        </Link>
      )}
    </div>
  );
}
