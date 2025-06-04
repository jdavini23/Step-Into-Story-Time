import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, TrendingUp, Crown, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import type { TierInfo } from "@/hooks/useTierInfo";

interface WeeklyUsageTrackerProps {
  tierInfo: TierInfo;
}

// This component has been replaced by the consolidated notification system in dashboard.tsx
// All weekly usage tracking is now handled centrally with proper prioritization
export function WeeklyUsageTracker() {
  return null;
}
