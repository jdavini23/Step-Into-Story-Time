import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Crown, 
  Palette, 
  Volume2, 
  Download, 
  Calendar,
  Users,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { useLocation } from "wouter";
import type { TierInfo } from "@/hooks/useTierInfo";

interface PremiumFeatureShowcaseProps {
  tierInfo: TierInfo;
}

export function PremiumFeatureShowcase({ tierInfo }: PremiumFeatureShowcaseProps) {
  const [, setLocation] = useLocation();

  if (tierInfo.tier !== 'free') return null;

  const premiumFeatures = [
    {
      icon: <Palette className="w-5 h-5" />,
      title: "AI Illustrations",
      description: "Beautiful AI-generated images for every story",
      tier: "Premium"
    },
    {
      icon: <Volume2 className="w-5 h-5" />,
      title: "Audio Narration",
      description: "Professional voice narration for bedtime",
      tier: "Premium"
    },
    {
      icon: <Download className="w-5 h-5" />,
      title: "PDF Downloads",
      description: "Save and print your favorite stories",
      tier: "Premium"
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      title: "Story Scheduling",
      description: "Schedule stories for bedtime delivery",
      tier: "Premium"
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Multiple Profiles",
      description: "Create profiles for up to 6 children",
      tier: "Family"
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "Magic Letters",
      description: "Interactive letters from story characters",
      tier: "Family"
    }
  ];

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 dark:border-purple-800 mb-6">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-2">
            <Crown className="w-6 h-6 text-purple-600 mr-2" />
            <h3 className="text-xl font-bold text-purple-800 dark:text-purple-200">
              Unlock Premium Features
            </h3>
          </div>
          <p className="text-purple-700 dark:text-purple-300 text-sm">
            Discover what you're missing with our premium storytelling features
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {premiumFeatures.map((feature, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex-shrink-0 text-purple-600 dark:text-purple-400">
                {feature.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    {feature.title}
                  </h4>
                  <Badge 
                    variant="secondary" 
                    className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                  >
                    {feature.tier}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button
            onClick={() => setLocation("/pricing")}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 px-6 py-2"
          >
            <Crown className="w-4 h-4 mr-2" />
            View Pricing Plans
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}