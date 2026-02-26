import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Heart, Calendar, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
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
  onToggleFavorites,
}: QuickActionsGridProps) {
  const [, setLocation] = useLocation();

  const thisWeekCount = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return stories.filter((story) => {
      if (!story.createdAt) return false;
      return new Date(story.createdAt) > weekAgo;
    }).length;
  }, [stories]);

  const quickActions = [
    {
      title: "Create New Story",
      description: "Start crafting a magical tale",
      icon: PlusCircle,
      color: "bg-story-gold",
      onClick: () => setLocation("/story-wizard"),
    },
    {
      title: showFavorites ? "All Stories" : "Favorites",
      description: showFavorites
        ? "View all your stories"
        : "Your beloved stories",
      icon: Heart,
      color: "bg-story-sunset",
      count: showFavorites ? stories.length : favoriteStories.length,
      onClick: onToggleFavorites,
    },
    {
      title: "This Week",
      description: "Stories created recently",
      icon: Calendar,
      color: "bg-story-moonlight",
      count: thisWeekCount,
    },
    {
      title: "Story Library",
      description: "Total stories created",
      icon: TrendingUp,
      color: "bg-story-forest",
      count: stories.length,
    },
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {quickActions.map((action) => (
        <Card
          key={action.title}
          className={`relative overflow-hidden transition-shadow duration-200 hover:shadow-lg group ${
            action.onClick ? "cursor-pointer" : ""
          }`}
          onClick={action.onClick}
        >
          <CardContent className="p-6">
            <div
              className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-4`}
            >
              <action.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-story-bark mb-1">{action.title}</h3>
            <p className="text-story-bark/60 text-sm mb-2">{action.description}</p>
            {action.count !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-story-bark">
                  {action.count}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
