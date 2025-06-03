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

// This component has been replaced by the consolidated notification system in dashboard.tsx
// All library capacity warnings are now handled centrally with proper prioritization
export function LibraryCapacityWarning() {
  return null;
}