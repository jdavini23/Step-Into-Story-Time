import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, TrendingUp, Crown, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import type { TierInfo } from "@/hooks/useTierInfo";

interface WeeklyUsageTrackerProps {
  tierInfo: TierInfo;
}

export function WeeklyUsageTracker({ tierInfo }: WeeklyUsageTrackerProps) {
  const [, setLocation] = useLocation();

  if (tierInfo.tier !== 'free') return null;

  const { weeklyUsage, limits, storiesRemaining } = tierInfo;
  const maxStories = limits.storiesPerWeek || 3;
  const usagePercentage = (weeklyUsage / maxStories) * 100;
  const isNearLimit = weeklyUsage >= maxStories - 1;
  const isAtLimit = weeklyUsage >= maxStories;

  // Calculate days until reset (assuming Monday reset)
  const now = new Date();
  const currentDay = now.getDay();
  const daysUntilReset = currentDay === 0 ? 1 : 8 - currentDay; // Sunday = 0, Monday = 1

  const getProgressColor = () => {
    if (usagePercentage >= 100) return "bg-red-500";
    if (usagePercentage >= 80) return "bg-amber-500";
    return "bg-green-500";
  };

  const getStatusMessage = () => {
    if (isAtLimit) {
      return `You've used all ${maxStories} stories this week. Resets in ${daysUntilReset} day${daysUntilReset !== 1 ? 's' : ''}.`;
    }
    if (isNearLimit) {
      return `Almost at your weekly limit! ${storiesRemaining} story remaining.`;
    }
    return `You have ${storiesRemaining} stories remaining this week.`;
  };

  return (
    <Card className={`border-2 ${isAtLimit ? 'border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800' : isNearLimit ? 'border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800' : 'border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800'} mb-6`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Calendar className={`w-6 h-6 ${isAtLimit ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-blue-600'}`} />
            <div>
              <h3 className={`font-semibold ${isAtLimit ? 'text-red-800 dark:text-red-200' : isNearLimit ? 'text-amber-800 dark:text-amber-200' : 'text-blue-800 dark:text-blue-200'}`}>
                Weekly Story Usage
              </h3>
              <p className={`text-sm ${isAtLimit ? 'text-red-700 dark:text-red-300' : isNearLimit ? 'text-amber-700 dark:text-amber-300' : 'text-blue-700 dark:text-blue-300'}`}>
                {getStatusMessage()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${isAtLimit ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-blue-600'}`}>
              {weeklyUsage}/{maxStories}
            </div>
            <div className={`text-xs ${isAtLimit ? 'text-red-500' : isNearLimit ? 'text-amber-500' : 'text-blue-500'}`}>
              stories used
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span>{Math.round(usagePercentage)}%</span>
          </div>
          
          <Progress 
            value={usagePercentage} 
            className="h-3"
          />

          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>Resets every Monday</span>
            <span>{daysUntilReset} day{daysUntilReset !== 1 ? 's' : ''} until reset</span>
          </div>
        </div>

        {(isNearLimit || isAtLimit) && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Want unlimited stories?
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
        )}
      </CardContent>
    </Card>
  );
}