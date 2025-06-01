
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface EmptyStateProps {
  showFavorites: boolean;
}

export function EmptyState({ showFavorites }: EmptyStateProps) {
  return (
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
  );
}
