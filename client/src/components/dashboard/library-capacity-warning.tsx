import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Crown, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import type { TierInfo } from "@/hooks/useTierInfo";

interface LibraryCapacityWarningProps {
  tierInfo: TierInfo;
  currentStoryCount: number;
}

export function LibraryCapacityWarning({ tierInfo, currentStoryCount }: LibraryCapacityWarningProps) {
  const [, setLocation] = useLocation();
  
  if (tierInfo.tier !== 'free') return null;

  const maxStories = tierInfo.limits.maxStoriesInLibrary || 3;
  const isNearLimit = currentStoryCount >= maxStories - 1;
  const isAtLimit = currentStoryCount >= maxStories;

  if (!isNearLimit) return null;

  return (
    <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 mb-6">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-800 dark:text-amber-200">
              {isAtLimit ? 'Story Library Full' : 'Library Almost Full'}
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              {isAtLimit 
                ? `You've reached your limit of ${maxStories} stories. To create new stories, you'll need to delete older ones or upgrade to Premium.`
                : `You have ${currentStoryCount} of ${maxStories} stories. Premium users get unlimited story storage.`
              }
            </p>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-amber-200 dark:bg-amber-800 rounded-full h-2">
                  <div 
                    className="bg-amber-600 dark:bg-amber-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((currentStoryCount / maxStories) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  {currentStoryCount}/{maxStories}
                </span>
              </div>
              <Button
                onClick={() => setLocation("/pricing")}
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90"
              >
                <Crown className="w-4 h-4 mr-1" />
                Upgrade
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}