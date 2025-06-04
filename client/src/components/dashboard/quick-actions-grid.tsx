
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
  onToggleFavorites 
}: QuickActionsGridProps) {
  const [, setLocation] = useLocation();

  const quickActions = [
    {
      title: "Create New Story",
      description: "Start crafting a magical tale",
      icon: PlusCircle,
      color: "from-purple-500 to-pink-500",
      onClick: () => setLocation("/story-wizard"),
    },
    {
      title: showFavorites ? "All Stories" : "Favorites",
      description: showFavorites ? "View all your stories" : "Your beloved stories",
      icon: Heart,
      color: "from-red-500 to-pink-500",
      count: showFavorites ? stories.length : favoriteStories.length,
      onClick: onToggleFavorites,
    },
    {
      title: "This Week",
      description: "Stories created recently",
      icon: Calendar,
      color: "from-blue-500 to-cyan-500",
      count: stories.filter(story => {
        if (!story.createdAt) return false;
        const storyDate = new Date(story.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return storyDate > weekAgo;
      }).length,
    },
    {
      title: "Story Library",
      description: "Total stories created",
      icon: TrendingUp,
      color: "from-green-500 to-emerald-500",
      count: stories.length,
    },
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {quickActions.map((action, index) => (
        <Card 
          key={action.title}
          className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg group ${
            action.onClick ? 'cursor-pointer hover:scale-105' : ''
          }`}
          onClick={action.onClick}
        >
          <CardContent className="p-6">
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
              <action.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
            <p className="text-gray-600 text-sm mb-2">{action.description}</p>
            {action.count !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">{action.count}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
